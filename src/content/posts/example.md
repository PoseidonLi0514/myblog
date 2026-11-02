---
title: Markdown 样式一览
date: 2026-11-02
description: 主题支持的所有 Markdown 元素都在这里：标题、列表、引用、提示块、代码、表格、公式、脚注和图片。写文章时可以当作速查表。
tags: [博客, 排版, 参考]
category: 杂谈
---

这篇文章把主题支持的元素都放了一遍，用来检查排版，也可以当作写作时的速查表。源文件在 `src/content/posts/example.md`，对照着看最直观。

## 段落与行内元素

正文段落之间留一行空白。中文和 English 混排时，浏览器会自动在两者之间留出一点间隙。行内可以有**粗体**、*强调*、~~删除线~~、`行内代码`、[站内链接](/posts/)和[外部链接](https://docs.astro.build)，外部链接后面会有一个小箭头。

快捷键用 <kbd>Ctrl</kbd> + <kbd>K</kbd> 这样写，需要划重点的地方可以用 <mark>高亮</mark>。脚注像这样[^footnote]，点击数字会跳到文末，再点 ↩ 回来。[^ccc]

*English emphasis looks like this*，而*中文强调会换成楷体*，两者可以写在同一处。

## 标题层级

文章标题本身是一级标题，正文从二级开始。二级和三级标题会出现在目录里。

### 这是三级标题

三级标题用于小节。

#### 这是四级标题

四级标题改用无衬线，适合段落内的小标签。

## 列表

无序列表：

- 列表项的圆点是朱红色
- 可以嵌套
  - 第二层
  - 第二层的另一项
- 回到第一层

有序列表：

1. 先确认问题能稳定复现
2. 再缩小范围，一次只改一个变量
3. 最后写下结论，以及你是怎么排除其他可能的

任务列表：

- [x] 写完初稿
- [x] 检查代码能否运行
- [ ] 隔一天再读一遍

## 引用

> 写作是思考的一种形式。没有写下来的想法，往往只是一个想法的感觉。
>
> 引用块用楷体，左侧一道朱红细线。

## 提示块

和 GitHub 一样的语法，在引用的第一行写 `[!NOTE]` 之类的标记。五种类型用颜色和图形两种方式区分：

> [!NOTE]
> 补充信息，读者跳过也不影响理解。

> [!TIP]
> 更好的做法，或者一个小技巧。

> [!IMPORTANT]
> 读者必须知道的信息，跳过可能会出错。

> [!WARNING]
> 可能导致问题、需要留意的地方。

> [!CAUTION]
> 有风险的操作，比如会删除数据或者影响线上环境。

## 代码

代码块支持文件名、行高亮、行号和自动换行，都写在语言名后面。右上角有复制按钮。

```python title="verify.py" {7} nums
import hmac
import hashlib

def verify(message: bytes, signature: str, key: bytes) -> bool:
    expected = hmac.new(key, message, hashlib.sha256).hexdigest()
    # 用常量时间比较，避免通过响应时间推测签名
    return hmac.compare_digest(expected, signature)
```

`diff` 会给增删行加上底色，复制时不会带上行首的 `+` 和 `-`：

```diff
- cursor.execute(f"SELECT * FROM users WHERE name = '{name}'")
+ cursor.execute("SELECT * FROM users WHERE name = %s", (name,))
```

终端命令：

```bash
curl -sI https://example.com | grep -i '^cache-control'
```

一行很长的内容可以加 `wrap`，让它自动换行而不是横向滚动：

```http wrap
GET /search?q=%E6%9C%B1%E7%A0%82&page=1&sort=relevance&filter=lang%3Azh&utm_source=newsletter&utm_medium=email HTTP/1.1
Host: example.com
Accept: text/html
```

没有语言和文件名的代码块不显示头部，复制按钮在鼠标悬停时出现：

```
$ astro build
  16 page(s) built in 1.82s
```

## 表格

表格用书籍里常见的三线表样式。内容太宽时可以横向滚动。

| 响应头 | 作用 | 常见取值 |
| :--- | :--- | :--- |
| `Content-Security-Policy` | 限制页面可以加载的资源来源 | `default-src 'self'` |
| `Strict-Transport-Security` | 要求浏览器只用 HTTPS 访问 | `max-age=31536000` |
| `X-Content-Type-Options` | 禁止浏览器猜测 MIME 类型 | `nosniff` |
| `Referrer-Policy` | 控制跳转时带出多少来源信息 | `strict-origin-when-cross-origin` |

## 公式

行内公式写在单个美元符号之间，比如 $O(n \log n)$。独立公式用两个美元符号：

$$
P(\text{collision}) \approx 1 - e^{-\frac{n^2}{2m}}
$$

上面是生日问题的近似：从 $m$ 个可能的哈希值里随机取 $n$ 个，至少两个相同的概率。$m = 2^{64}$ 时，大约 $2^{32}$ 次就有一半的概率撞上。

## 图片

单独一行的图片，如果写了标题，会变成带图注的插图：

![一次请求经过浏览器、CDN 与源站的路径](/images/request-flow.svg "图 1　一次请求的路径：浏览器 → CDN → 源站")

## 折叠内容

<details>
<summary>点击展开完整的响应头</summary>

```http
HTTP/2 200
content-type: text/html; charset=utf-8
cache-control: public, max-age=0, must-revalidate
strict-transport-security: max-age=31536000
x-content-type-options: nosniff
```

</details>

## 分隔线

分隔线是三个小点：

---

分隔线之后的段落。到这里，所有元素都出现过一次了。

[^footnote]: 脚注的内容在文章末尾，字号小一些。也可以写得比较长，比如解释一个术语的来历，或者给出参考资料的链接：[CommonMark 规范](https://spec.commonmark.org/)。
[^ccc]: 这是一个脚注
