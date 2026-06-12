# 面向新手：给 Codex 寻找、安装 skill 的多种办法

## 1. Codex skill 是什么？

你可以把 **Codex skill** 理解成：

> 给 Codex 安装的一份“专项工作说明书”。

一个 skill 通常是一个文件夹，里面最重要的是：

```text
SKILL.md
```

典型结构长这样：

```text
my-skill/
  SKILL.md
  scripts/
  references/
  assets/
```

其中：

```text
SKILL.md      必须有，用来告诉 Codex 这个 skill 是什么、什么时候用、怎么做
scripts/      可选，用来放辅助脚本
references/   可选，用来放参考资料
assets/       可选，用来放模板、图片、示例文件
```

最小可用结构是：

```text
my-skill/
  SKILL.md
```

skills通常可以自动触发，也可以输入 美金符号“$”+skill名称手动调用，示例：

```text
$jhss-weekly-ppt 帮我生成周报
```

---

# 2. Codex skill 应该安装在哪里？

## macOS / Linux 常用路径

个人全局 skill 放这里：

```bash
~/.codex/skills
```

完整展开后，在 macOS 上通常是：

```bash
/Users/你的用户名/.codex/skills
```

```

## Windows 常用路径

Windows 上对应的是用户目录下的 `.codex\skills`：

```powershell
%USERPROFILE%\.codex\skills
```

完整路径通常类似：

```powershell
C:\Users\你的用户名\.codex\skills
```

例如：

```powershell
C:\Users\Byron\.codex\skills
```

# 3. 寻找 Codex skill 的几种办法

## 办法一：用 Codex 内置的 `$skill-installer`

这是最适合新手的方法。

在 Codex 里输入：

```text
$skill-installer
```

或者直接让它安装某个 skill：

```text
$skill-installer gh-address-comments
```

OpenAI 官方 `openai/skills` 仓库说明，可以通过 `$skill-installer` 安装 curated skills，也可以指定 experimental skill 文件夹。([GitHub][2])

你也可以这样说：

```text
$skill-installer 帮我列出现在可以安装的 skills
```

或者：

```text
$skill-installer 安装适合 code review 的 skill
```

适合场景：

```text
你不想手动下载
你不知道 skill 文件该放哪
你想安装官方或 curated skills
```

---

## 办法二：去 GitHub 搜索现成 skill

推特/抖音/小红书等社区有时会推荐一些skills。
你通常可以在 GitHub 找到它们。


但社区仓库要注意安全，尤其是带 `scripts/` 的 skill。

---

## 办法三：从 Claude / Agent Skills 生态迁移

很多 skill 采用的是通用的 **Agent Skills** 结构，也就是：

```text
skill-folder/
  SKILL.md
```

所以有些 Claude Code / OpenClaw / Codex skill 之间可以互相参考。新手可以先不管兼容细节，只记住：

```text
核心是 SKILL.md
路径是 ~/.codex/skills
```

如果你看到一个 Claude skill，里面也是：

```text
SKILL.md
scripts/
references/
```

那大概率可以改造成 Codex skill。

---

## 办法四：让 Codex 帮你生成一个 skill

举个例子，你可以直接对 Codex 说：

```text
使用 $skill-creator 帮我创建一个 Codex skill，用来阅读 A 股券商研报。
要求面向新手，输出投资逻辑、估值假设、风险点、财务数据、后续追问清单。
```
