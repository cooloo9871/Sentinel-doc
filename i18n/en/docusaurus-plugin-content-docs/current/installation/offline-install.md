---
id: offline-install
title: Offline Installation (Air-gapped)
sidebar_position: 4
---

# Offline Installation (Air-gapped)

## When to Use It

When the cluster has no internet access, neither [Kubernetes Job Installation](./job-install.md) nor [Local Script Installation](./script-install.md) can be used: both download from GitHub, Helm repositories and public registries.

Since v0.71.0, every [release](https://github.com/cooloo9871/K8s_Sentinel/releases) carries two assets:

| Asset | What it is |
|---|---|
| `sentinel-images-<version>.txt` | Every image that release needs: K8s Sentinel, Tetragon, Trivy Operator, Trivy, and Trivy's two vulnerability databases |
| `sentinel-offline-<version>.tar.gz` | The manifests and scripts. It holds no images, so it is small |

The bundle installs the versions the image list names and no others: Tetragon and Trivy Operator are rendered from their charts when the release is built, so **the cluster side needs `kubectl` only, not Helm**.

The process has three steps:

1. On a machine with internet access, download the bundle and save the images
2. Carry the directory to the offline side and push the images to a private registry the cluster's nodes pull from
3. Install with `install.sh --registry`

---

## Before You Start

| Item | Description |
|---|---|
| **A private registry** | A registry the cluster's nodes can pull from (Harbor, for example). With Harbor, first create the project the images go into (`sentinel` in the examples below) |
| **Pullable without credentials** | The nodes and Trivy both have to pull from the registry **without credentials**. The bundle sets no image pull secret |
| **Nodes trust the registry's certificate** | That is the container runtime's configuration on every node (containerd's `certs.d`), which the bundle does not touch. If other workloads already pull from this registry, it is done |
| **Tools to carry the images** | `mirror-images.sh` uses `skopeo` when it is installed. Without it, `docker`, `podman` or `nerdctl` carry the images, but not Trivy's vulnerability databases: those are OCI artifacts, not container images, and need `skopeo` or `oras` |
| **CPU architecture** | Images are saved for the architecture of the machine that runs `save`. Run it on one that matches your nodes |
| **Cluster prerequisites** | The same as for an online install: Kubernetes 1.32+ and Cilium (with kube-proxy replacement and Hubble), see [Prerequisites](../prerequisites.md). Cilium is not part of the bundle and has to be installed offline by your own means |

:::caution[No databases, no scans]
Without Trivy's two databases in the registry, K8s Sentinel still installs and runs, but **no image can be scanned**. Make sure `skopeo` or `oras` is on the machine that runs `mirror-images.sh`.
:::

---

## Step 1: Download and Save the Images (Online Machine)

Download the bundle from the release page (v0.72.0 is used below; replace it with the version you are installing):

```bash
curl -LO https://github.com/cooloo9871/K8s_Sentinel/releases/download/v0.72.0/sentinel-offline-v0.72.0.tar.gz
tar xzf sentinel-offline-v0.72.0.tar.gz
cd sentinel-offline-v0.72.0
bash mirror-images.sh save        # about 2 GB, into ./images
```

What the bundle contains:

| File | Purpose |
|---|---|
| `images.txt` | The image list, identical to `sentinel-images-<version>.txt` on the release |
| `mirror-images.sh` | Saves (`save`) and pushes (`push`) the images |
| `install.sh` | The offline installer |
| `uninstall.sh` | The uninstaller, see [Uninstall](../uninstall.md) |
| `manifests/` | `sentinel.yaml`, `tetragon.yaml`, `tetragon-grpc-policy.yaml`, `trivy-operator.yaml` |
| `VERSION` | The bundle's version |

For v0.72.0, `images.txt` lists:

```text
ghcr.io/cooloo9871/sentinel:v0.72.0
mirror.gcr.io/aquasec/trivy:0.76.1
mirror.gcr.io/aquasec/trivy-operator:0.36.1
quay.io/cilium/hubble-export-stdout:v1.1.1
quay.io/cilium/tetragon-operator:v1.8.0
quay.io/cilium/tetragon:v1.8.0
# artifacts
mirror.gcr.io/aquasec/trivy-db:2
mirror.gcr.io/aquasec/trivy-java-db:1
```

The last two are Trivy's vulnerability databases (OCI artifacts).

---

## Step 2: Push the Images to the Private Registry

Carry the whole `sentinel-offline-<version>` directory (including `images/`) to the offline side and, on a machine that reaches the registry, run:

```bash
bash mirror-images.sh push harbor.example.com/sentinel
```

The registry argument is a host and path, without `http://` or `https://`.

**An image keeps its path under the registry**; only the leading registry host is replaced:

| Original location | Location after the push |
|---|---|
| `quay.io/cilium/tetragon:v1.8.0` | `harbor.example.com/sentinel/cilium/tetragon:v1.8.0` |
| `ghcr.io/cooloo9871/sentinel:v0.72.0` | `harbor.example.com/sentinel/cooloo9871/sentinel:v0.72.0` |
| `mirror.gcr.io/aquasec/trivy-db:2` | `harbor.example.com/sentinel/aquasec/trivy-db:2` |

A machine that reaches both the internet and the registry can do it in one go:

```bash
bash mirror-images.sh save && bash mirror-images.sh push harbor.example.com/sentinel
```

Environment variables `mirror-images.sh` reads:

| Variable | Description |
|---|---|
| `INSECURE=1` | For pushing to a registry on plain HTTP or with a certificate this machine does not trust. It only affects the pushing machine and **does not change what the cluster trusts**. `docker` has no such switch: the registry has to be listed under `insecure-registries` in its daemon's configuration |
| `CONTAINER_CLI` | Names the command to use in place of the detected `docker` / `podman` / `nerdctl`, for example `CONTAINER_CLI="sudo podman"` |
| `IMAGES_DIR` | Where the images are kept; defaults to `./images` inside the bundle |

---

## Step 3: Install

On a machine with `kubectl` access to the cluster, run:

```bash
bash install.sh --registry harbor.example.com/sentinel
```

The script rewrites every image in the manifests to its location in the private registry, then runs in order:

1. **Tetragon**: skipped when a Tetragon DaemonSet exists in any namespace; otherwise `tetragon.yaml` is applied and waited for. The NetworkPolicy `tetragon-grpc` is applied afterwards
2. **K8s Sentinel**: applies `sentinel.yaml` and waits for the Deployment
3. **Trivy Operator**: skipped when a Trivy Operator exists in any namespace; otherwise installed into `sentinel-system`

As with the online installers, **a Tetragon or a Trivy Operator already in the cluster is left as it is**. An existing Tetragon needs the gRPC address K8s Sentinel requires set by you, see [Installing Tetragon](./tetragon-install.md).

| Option | Description |
|---|---|
| `--registry <host/path>` | Required. Where `mirror-images.sh push` pushed the images |
| `--render-only <dir>` | Writes the manifests it would apply into the directory and **applies nothing**: to read them first, or to apply them your own way |
| `--insecure-registry` | v0.72.0+. For a registry whose certificate is signed by a CA of your own, or that serves plain HTTP; see the next section |

The K8s Sentinel in the bundle differs from an online install in three ways:

- The image is pinned to the release's version tag instead of `latest`, and `imagePullPolicy` is `IfNotPresent`
- The Deployment has `TRIVY_IMAGE`, `TRIVY_DB_REPOSITORY` and `TRIVY_JAVA_DB_REPOSITORY` set, so [Registry Scanning](../features/registry-scanning.md) uses the same Trivy and databases as Trivy Operator, likewise pointed at the private registry
- Tetragon and Trivy Operator are applied as manifests, so there are no Helm releases in the cluster

Access after installation is the same as online:

```bash
kubectl port-forward -n sentinel-system svc/sentinel 8080:80
```

Then change the default password as described in [First Login](../login.md), and for production complete [Persistent Storage](./persistent-storage.md).

---

## A Registry With Your Own CA or Plain HTTP

The nodes and Trivy trust the registry **separately**:

| Who pulls | What makes it trust the registry |
|---|---|
| The nodes' container runtime (pulls every pod's image) | The node's own configuration (containerd's `certs.d`). Neither the bundle nor `--insecure-registry` does anything for this |
| Trivy (downloads the vulnerability databases, reads the images it scans) | Trivy runs in pods and **does not use the node's configuration**. Either the certificate comes from a public CA, or you install with `--insecure-registry` |

```bash
bash install.sh --registry harbor.example.com/sentinel --insecure-registry
```

With `--insecure-registry` (v0.72.0+), Trivy downloads its databases and reads the images it scans **without verifying certificates**.

:::warning
This turns certificate verification off for Trivy **everywhere**, the other registries it scans included, not only the one that holds the databases.
:::

For K8s Sentinel's own registry scans, `--insecure-registry` sets the environment variable `TRIVY_INSECURE=true` on the Deployment.

---

## Refreshing the Vulnerability Databases

The vulnerability databases change daily, but an offline scan knows only the vulnerabilities published **up to the day the databases were saved**. Run `save` and `push` again on a schedule to refresh the copy in the private registry.

---

## Upgrading

Upgrading is the same as installing: download the new release's bundle and repeat the three steps.

`install.sh` re-applies K8s Sentinel's manifest, so the note in the [Installation Overview](./index.md) about re-applying `deploy/sentinel.yaml` holds here too: if you changed the Deployment or the Service (a PVC, a NodePort), render the manifests with `--render-only` first, carry your changes into them, and apply those.

---

## Uninstalling

Use the `uninstall.sh` in the bundle; see [Uninstall](../uninstall.md) for its options and behaviour:

```bash
bash uninstall.sh --dry-run
bash uninstall.sh
```

---

## Building the Bundle Yourself

To produce a bundle yourself (for an unreleased version, say), run this from the K8s Sentinel source directory on a machine with internet access and Helm:

```bash
bash deploy/offline/build.sh v0.72.0
```

The two files are written to `dist/`. The Tetragon and Trivy Operator chart versions are defined in `deploy/offline/versions.env`.
