---
layout: post
title: Kubernetes Pod 亲和性和反亲和性 
date: 2018-11-08 11:28 +0800
---

* toc
{:toc}

* 官方原文 [Assigning Pods to Nodes](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/)

通过 Kubernetes 你可以将一个 pod 限制或倾向于在某些特定节点运行。有几种方式可以达到这个目的，它们都通过 [label selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) 进行选择。通常情况下，这样的约束是不必要的，因为调度程序会自动进行合理的调度（如通过一系列的评分机制将 pods 合理分配到最优节点上，而不会将 pod 分配在没有足够资源的节点上等）。但是在某些情况下，可能需要更多的策略控制，例如，将 pod 调度到 SSD 的计算节点上，或者将两个通信比较频繁的不同服务 pod 调度到同一个可用域。

`labels` 在 K8s 中是一个很重要的概念，作为一个标识，Service、Deployments 和 Pods 之间的关联都是通过 `label` 来实现的。而每个节点也都拥有 `label`，通过设置 `label` 相关的策略可以使得 pods 关联到对应 `label` 的节点上。

## 一、nodeSelector

`nodeSelector` 是最简单的约束方式。`nodeSelector` 是 PodSpec 的一个字段。

通过 `--show-labels` 可以查看当前 nodes 的 `labels`

```
$ kubectl get nodes --show-labels
NAME       STATUS    ROLES     AGE       VERSION   LABELS
minikube   Ready     <none>    1m        v1.10.0   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/
hostname=minikube
```

如果没有额外添加 nodes `labels`，那么看到的如上所示的默认标签。我们可以通过 `kubectl label node` 命令给指定 node 添加 `labels`：

```
$ kubectl label node minikube disktype=ssd
node/minikube labeled
$ kubectl get nodes --show-labels
NAME       STATUS    ROLES     AGE       VERSION   LABELS
minikube   Ready     <none>    5m        v1.10.0   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,disktype=ssd,kubernetes.io/hostname=minikube
```

> 当然，你也可以通过 `kubectl label node` 删除指定的 `labels`（标签 key 接 `-` 号即可）
> ```
> $ kubectl label node minikube disktype-
> node/minikube labeled
> $ kubectl get node --show-labels
> NAME       STATUS    ROLES     AGE       VERSION   LABELS
> minikube   Ready     <none>    23m       v1.10.0 beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=minikube
> ```

创建测试 pod 并指定 `nodeSelector` 选项绑定节点：

```
$ cat nginx.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    env: test
spec:
  containers:
  - name: nginx
    image: nginx
    imagePullPolicy: IfNotPresent
  nodeSelector:
    disktype: ssd
$ kubectl create -f nginx.yaml
pod/nginx created
```

查看 pod 调度的节点，即我们指定有 `disktype=ssd` label 的 minikube 节点：

```
$ kubectl get pods -o wide
NAME      READY     STATUS    RESTARTS   AGE       IP           NODE
nginx     1/1       Running   0          1m        172.18.0.4   minikube
```

`nodeSelector` 可以很方便的解决以上比较简单的需求，但是它还不够灵活。比如我想以机架为单位，部署的服务可以很好的分散在不同机架的服务器上，此时 `nodeSelector` 就并不是那么管用了。因此，Kubernetes 引入了亲和性和反亲和性概念。

## 二、亲和性和反亲和性（Affinity and anti-affinity）

affinity/anti-affinity 特性还处于 beta 状态，相比 `nodeSelector` 来说有几点优势：

* 1、提供更多的表示式（不仅仅是 and 匹配）
* 2、可以指定 “软” 规则限制而不仅仅是硬限制，因此即使调度器不能满足它的规则，也可以正常调度 pod
* 3、可以针对 node 上运行的 pods 指定 `labels`，而不仅仅局限于 node 本身

affinity 特性拥有两种类型，一种是 node affinity，一种是 pod affinity/anti-affinity。node affinity 类似 `nodeSelector`，但同时拥有上文提到的 1、2 两点优势，pod affinity/anti-affinity 针对 pods 指定 `labels`，同时拥有以上三点优势。

### 2.1 Node affinity

K8s 在 1.2 的时候以 alpha 的特性引入 node affinity。node affinity 通过 node `labels` 约束 pod 调度节点。Node affinity 有两种类型：

* `requiredDuringSchedulingIgnoredDuringExecution`  （硬限制，同 `nodeSelector`）
* `preferredDuringSchedulingIgnoredDuringExecution` （软限制）

看以下例子：

```
apiVersion: v1
kind: Pod
metadata:
  name: with-node-affinity
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/e2e-az-name
            operator: In
            values:
            - e2e-az1
            - e2e-az2
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1
        preference:
          matchExpressions:
          - key: another-node-label-key
            operator: In
            values:
            - another-node-label-value
  containers:
  - name: with-node-affinity
    image: k8s.gcr.io/pause:2.0
```

以上规则表达的意思是，该 Pod 只能被调度到拥有 `kubernetes.io/e2e-az-name=e2e-az1` 或者 `kubernetes.io/e2e-az-name=e2e-az2` 标签的节点上，其中在满足之前标签条件的同时更倾向于调度在拥有 `another-node-label-key=another-node-label-value` 标签的节点上。

新的 node affinity 支持 `In`、`NotIn`、`Exists`、`DoesNotExist`、`Gt`、`Lt` 操作符。可以使用 `NotIn`、`DoesNotExist` 来实现反亲和性，也可以通过 [node taints](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) 来实现。

如果同时指定 `nodeSelector` 和 `nodeAffinity`，两者同时满足才会被调度。如果 `nodeAffinity` 中指定了多个 `nodeSelectorTerms`，只要满足其中一个 `nodeSelectorTerms` 匹配条件即可调度。如果 `nodeSelectorTerms` 中有多个 `matchExpressions`，那么自由满足所有的条件才会被调度。

> [Node affinity and NodeSelector 设计文档](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/scheduling/nodeaffinity.md)

### 2.2 Pod affinity and anti-affinity

pod 亲和性和反亲和性在 K8s 1.4 版本引入，它基于运行在 node 上的 pod 标签来限制 pod 调度在哪个节点上，而不是节点的标签。

> pod 亲和性和反亲和性需要大量的计算，会显著降低集群的调度速度，不建议在大于几百个节点的集群中使用。
>
> pod 反亲和性要求集群中的所有节点必须具有 `topologyKey` 匹配的标签，否则可能会导致意外情况发生。

同 node affinity，pod 亲和性和反亲和性也有两种类型：

* `requiredDuringSchedulingIgnoredDuringExecution` （硬限制）
* `preferredDuringSchedulingIgnoredDuringExecution` （软限制）

不同的是，pod 通过 `podAntiAffinity` 设置反亲和性，如下例子：

```
apiVersion: v1
kind: Pod
metadata:
  name: with-pod-affinity
spec:
  affinity:
    podAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: security
            operator: In
            values:
            - S1
        topologyKey: failure-domain.beta.kubernetes.io/zone
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: security
              operator: In
              values:
              - S2
          topologyKey: kubernetes.io/hostname
  containers:
  - name: with-pod-affinity
    image: k8s.gcr.io/pause:2.0
```

以上示例表示，pod 必须调度在至少运行一个 `security=S1` 标签的 pod 的节点上（更准确的说，这个 pod 可以运行在节点 N 上，如果该节点有标签 key 为 `failure-domain.beta.kubernetes.io/zone`，而且运行着标签为 `security=S1` 的实例）。另外，反亲和规则表明最好不要调度到运行有 `security=S2` 标签的 pod 的节点上（更准确的说，如果这个节点拥有标签 key 为 `failure-domain.beta.kubernetes.io/zone`，但运行有 `security=S2` 标签的 pod，那么这个节点就不会被优先选择调度）。

> [pod affinity and anti-affinity 设计文档](https://git.k8s.io/community/contributors/design-proposals/scheduling/podaffinity.md)

`podAffinity` 和 `podAntiAffinity` 支持 `In`、`NotIn`、`Exists`、`DoesNotExist` 四种表达式。

原则上，`topologyKey` 可以为任何合法的键值对。但是因为性能和安全的原因，有以下限制：

* 1、针对 `podAffinity` 和 `podAntiAffinity` 中的 `requiredDuringSchedulingIgnoredDuringExecution`， `topologyKey` 为空是不允许的
* 2、针对 `podAntiAffinity` 中的 `requiredDuringSchedulingIgnoredDuringExecution`，准入控制器选项 `LimitPodHardAntiAffinityTopology` 可以把 `topologyKey` 限制为 `kubernetes.io/hostname`，如果想自定义值，可以修改准入控制器或者直接禁用
* 3、针对 `podAntiAffinity` 中的 `preferredDuringSchedulingIgnoredDuringExecution`，`topologyKey` 为空，则代表所有拓扑（仅限于 `kubernetes.io/hostname`, `failure-domain.beta.kubernetes.io/zone` and `failure-domain.beta.kubernetes.io/region`）
* 4、除了以上情况，`topologyKey` 可以为任意合法的键值对

除了 `labelSelector` 和 `topologyKey`，还可以指定 namespace 的 `labelSelector` 作为匹配。`labelSelector` 和 `topologyKey` 属于同一级别，如果未定义或设置为空值，那么默认为定义 pod affinity 和 anti-affinity 所在的空间。

## 三、实践案例

### 3.1 始终调度在同一个节点

在一个三个节点的集群中，一个 web 应用程序依赖内存存储，如 redis，我们想 web 程序尽可能的和缓存调度在同一个节点上。redis 的 Deployment 配置如下：

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-cache
spec:
  selector:
    matchLabels:
      app: store
  replicas: 3
  template:
    metadata:
      labels:
        app: store
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - store
            topologyKey: "kubernetes.io/hostname"
      containers:
      - name: redis-server
        image: redis:3.2-alpine
```

redis-cache 规则表达 pod 不被调度在同一个节点上。web-server 规则设置如下，表达 pod 不被调度在同一个节点上，并且必须调度在运行标签 `app=store` pod 的节点上。

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-server
spec:
  selector:
    matchLabels:
      app: web-store
  replicas: 3
  template:
    metadata:
      labels:
        app: web-store
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - web-store
            topologyKey: "kubernetes.io/hostname"
        podAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - store
            topologyKey: "kubernetes.io/hostname"
      containers:
      - name: web-app
        image: nginx:1.12-alpine
```

> 相关更多应用场景，建议阅读 [抽象优雅的 Affinity](http://wsfdl.com/kubernetes/2018/06/30/k8s-scheduler-1-affinity.html)，讲解的非常详细。

--EOF--
