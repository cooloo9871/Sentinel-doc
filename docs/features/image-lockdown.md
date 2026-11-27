---
id: image-lockdown
title: Image Lockdown
sidebar_position: 7
---

# Image Lockdown

## 功能說明

Image Lockdown 是一種不需要填寫任何規則的 Tracing Policy。選擇一個 Deployment、StatefulSet 或 DaemonSet 之後，它的容器只能執行 **Image 本身帶有的執行檔**，而且必須是**由容器自己的行程啟動**：

- 容器啟動後才下載或寫入的工具不在清單上，會被擋下
- 以 `kubectl exec` 送進容器的指令不是由容器自己啟動的，會被擋下

K8s Sentinel 會在節點上從執行中的容器讀取執行檔清單，工作負載的 Image 更換時會自動重新讀取，不需要人工維護。

---

## 鎖定工作負載

1. 進入「**Tracing Policy**」頁面，點擊右上角的「**+ Image Lockdown**」
2. 在對話框中選擇 **Namespace** 與 **Workload**（清單列出該 Namespace 的 Deployment、StatefulSet 與 DaemonSet）
3. 選擇 **Mode**：預設為 `Monitoring`，建議先觀察一段時間再切換為 `Protect`
![Image Lockdown 對話框](/img/features/image-lockdown/dialog.png)

4. 點擊「**Lock**」。按鈕會顯示 `Reading the image...`，K8s Sentinel 此時正在節點上讀取容器的執行檔清單

完成後會顯示 `<工作負載> locked to its image`，Tracing Policy 列表多出一個名為 **`image-lock-<工作負載名稱>`** 的 Policy（Namespace 層級，位於該工作負載的 Namespace）。

![列表中的 image-lock Policy](/img/features/policy/list.png)

| 情況 | 訊息 |
|---|---|
| 該工作負載已經鎖定過 | `a policy named "image-lock-<名稱>" already exists` |
| 工作負載沒有執行中的 Pod | `the workload has no running pod to read its image from` |
| Image 的執行檔多到一個 Policy 無法列出 | `the images have more executable files than one policy can list` |

這個功能需要 Tracing Policy 的 Manage 權限（見 [角色與權限](./roles.md)）。被限制在部分 Namespace 的帳號只能鎖定自己 Namespace 中的工作負載。

---

## 管理鎖定的 Policy

鎖定產生的 Policy 與其他 Tracing Policy 列在同一個列表中，操作方式也相同，只有一點不同：**清單由 K8s Sentinel 維護，不能編輯**。

| 操作 | 說明 |
|---|---|
| **View** | 取代其他 Policy 的 `Edit`，以唯讀方式開啟 YAML。透過 API 修改會被拒絕：`this policy's list is read from the workload's images and is not edited; switch its mode, or delete it` |
| **Mode** | 與其他 Policy 相同，直接在列表切換 `Monitoring` / `Protect`，見 [執行模式切換](./execution-mode.md) |
| **Delete** | 刪除 Policy 即解除鎖定 |

Image 更換時（例如 rollout），K8s Sentinel 會重新讀取清單並更新 Policy，Policy 原本的 Mode 與建立者都會保留。Rollout 期間新舊 Image 同時在執行，兩者的執行檔都會列入。

工作負載之後才加上 exec probe、exec lifecycle hook 或共用 process namespace，或以不同的 selector 重新建立時，Policy 同樣會自動重建（每 15 秒檢查一次）。

---

## `kubectl exec` 不會被擋下的情況

工作負載符合下列任一條件時，從外部送進容器的指令**不會被擋下**，只有執行檔清單生效：

- 設有 exec probe 或 exec lifecycle hook
- 使用 `shareProcessNamespace`
- 使用 `hostPID`

原因是 kubelet 自己的指令與 `kubectl exec` 以同樣的方式進入容器，擋下後 probe 與 hook 會跟著失敗。判斷時除了工作負載的 template，也會讀取實際的 Pod，因此由 webhook 注入的容器所帶的 exec probe 也算在內。這種情況下，鎖定完成的訊息會註明：`<工作負載> locked to its image. kubectl exec is not stopped for this workload.`

---

## 使用前須知

:::warning[Protect 模式下，你自己也無法從外部執行指令]
Policy 處於 Protect 時，任何人都不能以 `kubectl exec` 在容器中執行指令，除錯時也一樣。需要進入容器時，請先把該 Policy 切換為 Monitoring。
:::

- **Image 帶有的檔案都可以執行，判斷依據是路徑**：Image 中若有 shell 或 `curl`，取得應用程式控制權的人仍然可以執行它們；被擋下的只有之後才加入的檔案
- **清單比對的是路徑，不是內容**：清單上的檔案被原地覆寫後仍然可以執行；交給 Image 內直譯器執行的腳本（`sh x.sh`、`python x.py`）視為直譯器在執行；透過 Image 自己的 loader 執行的新執行檔也是如此。把根檔案系統設為唯讀可以防止第一種情況，後兩種無法由這個功能防止
- **Rollout 換成新 Image 時**：新 Image 的檔案要等到它的容器開始執行才能讀取，K8s Sentinel 每 15 秒檢查一次。在那之前，新 Image 才有的檔案會被視為不屬於 Image。同一個 Image 的不同版本之間路徑大多相同，不會有影響；但新 Image 的第一個行程若是舊 Image 沒有的檔案，處於 Protect 的鎖定會讓新容器完全無法啟動，見下方 [新 Image 被擋下](#新-image-被擋下)。Image 變動較大時，請先切換為 Monitoring 再 rollout
- **容器啟動後的最初幾秒不受保護**：Tetragon 在容器啟動後片刻才把 Policy 套用上去，這段時間內寫入並執行的檔案可以執行
- **Volume 上的執行檔不在清單上**：只列出 Image 自己的檔案系統，因此從 ConfigMap 掛載並直接執行的腳本會被擋下
- **執行一次就結束的 init container 不在範圍內**。以 init container 加上 `restartPolicy: Always` 撰寫的 sidecar 會持續執行，與其他容器一樣受到鎖定；由 webhook 加入 Pod 的容器也是
- **只支援 Deployment、StatefulSet 與 DaemonSet**：Job、獨立的 Pod 與其他 controller 管理的工作負載不會出現在選單中

- **每一個 Image Lockdown 都算一個 Tracing Policy**：計入叢集 127 個 Tracing Policy 的上限，超過時會標示為 **Not active** 而不生效，見 [Not active](./tracing-policy.md#not-active)

此功能已在 containerd（runc）與 CRI-O（crun 與 runc）搭配 Tetragon 1.8.0 驗證。

---

## 新 Image 被擋下

工作負載換成新的 Image，而新 Image 的第一個行程不在清單上時，處於 **Protect** 的鎖定會在新容器啟動的當下就把它擋下。容器從未執行，K8s Sentinel 也就無法讀取它的檔案，工作負載會**一直無法啟動，直到有人處理**。

這時 Tracing Policy 列表會在該 Policy 標示紅色的 **New image blocked, set to Monitoring**，滑鼠懸停可以看到是哪一個 Image。處理方式：

1. 把該 Policy 的 Mode 切換為 `Monitoring`
2. 等新容器啟動，K8s Sentinel 讀取新 Image 的清單（15 秒內）
3. 把 Mode 切回 `Protect`

:::note[K8s Sentinel 不會自行解除 Protect]
若自動把鎖定切出 Protect，任何有權限以該工作負載的 Label 建立 Pod 的人都能藉此關閉鎖定，因此降低保護的動作保留給管理者。
:::

---

## 運作原理

K8s Sentinel 為工作負載建立一個 `TracingPolicyNamespaced`，並以 annotation `sentinel.io/image-lock: <Kind>/<名稱>` 標記。Policy 在 kernel 即將執行檔案時檢查兩個條件，任一成立即觸發：

| 條件 | 擋下的行為 |
|---|---|
| 行程不是容器第一個行程的後代 | `kubectl exec`，以及從節點啟動的行程 |
| 即將執行的檔案不在清單上 | 容器啟動後才加入的檔案 |

- Policy 的 Pod selector 就是工作負載自己的 selector
- 清單的讀取方式與 [Behavior Discovery](./behavior-discovery.md) 讀取行程啟動路徑相同：在節點的 `tetragon` 容器中執行一支固定的腳本，因此同樣需要 `deploy/sentinel.yaml` 中的 Role 與 RoleBinding `sentinel-tetragon-exec`
- 建立清單時，容器啟動後才寫入的檔案會被排除，因此鎖定之前就已經被放進容器的工具，不會因為當時存在而被允許
- 觸發的事件與其他 Tracing Policy 相同，顯示在 [Security Events](./notifications.md)；Monitoring 時只記錄，Protect 時終止該行程
