---
title: "K8S StatefulSet 中更新 volumeClaimTemplates 的存储大小"
date: 2025-08-04 05:21:49
slug: "kubernetes/K8S-StatefulSet-中更新-volumeClaimTemplates-的存储大小"
categories: ["Kubernetes"]
tags: ["CheatSheet", "Kubernetes"]
---

截止 Kubernetes 到 1.33，StatefulSet 的 volumeClaimTemplates 中的存储大小是不可变的，这意味着你不能直接通过修改 StatefulSet 的配置来更新存储大小。

```
StatefulSet.apps "xxx" is invalid: spec: Forbidden: updates to statefulset spec for fields other than 'replicas', 'ordinals', 'template', 'updateStrategy', 'persistentVolumeClaimRetentionPolicy' and 'minReadySeconds' are forbidde
```

但是有几种方法可以实现存储扩容：

### 方法一：手动扩容现有 PVC（推荐）

这是最简单且风险最小的方法：

确保存储类支持卷扩展，检查 ALLOWVOLUMEEXPANSION 列是否为 true

```console
$ kubectl get storageclass
NAME            PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
ebs                ebs.csi.aws.com         Delete          WaitForFirstConsumer   true                   486d
```

直接编辑现有的 PVC

```bash
# 列出 StatefulSet 的 PVC
kubectl get pvc -l app=your-statefulset-name

# 编辑每个 PVC 的存储大小
kubectl edit pvc data-your-pod-0
```

在编辑器中修改：

```yaml
spec:
  resources:
    requests:
      storage: 20Gi  # 增加到新的大小
```

重启 Pod 使更改生效

```bash
kubectl delete pod your-pod-0
# Pod 会自动重新创建并使用扩容后的存储
```

观察看名称为 FileSystemResizeSuccessful 的事件也可以说明修改完成

```console
$ kubectl get event
LAST SEEN   TYPE      REASON                       OBJECT                                           MESSAGE
23m         Normal    Resizing                     persistentvolumeclaim/pvc-0         External resizer is resizing volume pvc-2762a663-c31a-427e-8cd5-5349f443ad98
23m         Normal    FileSystemResizeRequired     persistentvolumeclaim/pvc-0         Require file system resize of volume on node
22m         Normal    FileSystemResizeSuccessful   persistentvolumeclaim/pvc-0         MountVolume.NodeExpandVolume succeeded for volume "pvc-2762a663-c31a-427e-8cd5-5349f443ad98" ip-10-80-21-64.ec2.internal
```

## 方法二：重新创建 StatefulSet

如果需要修改 volumeClaimTemplates 模板（影响新创建的 Pod）：

备份 StatefulSet 配置

```bash
kubectl get statefulset your-statefulset -o yaml > statefulset-backup.yaml
```

删除 StatefulSet（保留 Pod）

```bash
kubectl delete statefulset your-statefulset --cascade=orphan
```

修改配置文件中的存储大小

```yaml
spec:
  volumeClaimTemplates:
  - spec:
      resources:
        requests:
          storage: 20Gi  # 更新大小
```

重新创建 StatefulSet

```bash
kubectl apply -f statefulset-backup.yaml
```

### 方法三：使用 Helm 的情况

如果使用 Helm 部署：

1. 先手动扩容现有 PVC（如方法一）

2. 更新 Helm values

```yaml
persistence:
  size: 20Gi
```

3. 升级 Helm release

```bash
helm upgrade your-release-name chart-name --values values.yaml
```

## 注意事项

- 存储类必须支持卷扩展：检查 allowVolumeExpansion: true
- 只能扩容，不能缩容：Kubernetes 不支持缩小存储大小
- 备份数据：在进行任何存储操作前建议备份重要数据
- 逐个操作：对于多副本 StatefulSet，建议逐个 Pod 进行操作以确保服务可用性

推荐使用方法一（手动扩容 PVC），因为它是最安全的方式，不需要重新创建 StatefulSet，对运行中的应用影响最小。

---

原文：[GitHub Issue #263](https://github.com/islishude/blog/issues/263)
