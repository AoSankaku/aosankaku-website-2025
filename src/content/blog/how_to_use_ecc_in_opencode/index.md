---
title: "【OpenCodeで】Everything-claude-codeを使いたい件"
category: "Tech"
date: "2026-06-29T16:00:00+09:00"
desc: "ECC(everything-claude-code)をOpencodeで使いたいのですが、グローバル適用するのに沼ったので記事にします。Windows、Linux（WSL）対応の試行錯誤過程が載っています。"
tags:
  - バイブコーディング
  - ECC
  - OpenCode
thumbnail: image.png
alt: OpenCodeでECCを使いたい！
---

> [!IMPORTANT] この記事に関して
> この記事は、私との過去の会話を参照しながあ、だいぶGPT-5.5が書きました。一応校正と検証はしていますが、何か動かなかった所があれば教えてください。

みなさん、バイヴコーディング楽しんでいますか？私は最高に楽しんでいます。

最近Claude Codeを見限ってCodexにお引越ししたのですが、特に枠自体について言えば軽くなった感じはしません。辛いですね。貧民は我慢するしかないのです。

ただ、Claude Codeから離れると別の問題が出ます。

**Claude Code向けに整っている便利設定やコマンド資産を、OpenCode側でも使いたい。**

特に使いたかったのが、**Everything Claude Code**、通称ECCです。

https://github.com/affaan-m/ECC/tree/main

この凄まじい量のスターがついているリポジトリはClaude Code向けの設定集・コマンド集・エージェント集・スキル集のようなもので、雑に言えば「AIコーディングエージェントに作法を仕込むための調教キット」です。バイヴコーディング初心者でも、これを使えばスーパーぷよぐらまーにたちまち早変わり、ということです。多分。

この記事では、OpenCodeでECCを使うための最小導入方法と、私が沼ったポイントを書きます。なぜか全然検索しても出ないので、誰かの参考になったら嬉しいです。

```toc
```

## 結論：導入方法

> [!NOTE] 環境について
> Windows Powershell環境を前提とします。また、Gitも入っている前提とします。

## Windowsネイティブでの最小導入

WindowsのPowerShellで、ECCのskills、commands、agentsをOpenCode用にまとめて入れるコマンドです。

skillsとcommandsは、基本的にディレクトリの中身をそのままコピーします。agentsだけは適当に入れても動かないので、Claude Code用のfrontmatterをOpenCode用に変換してから配置します。

> [!WARNING] コマンドの実行
> このサイトを含め、コマンドは適当に実行しないようにしてください。自分で意味を理解するのが面倒なら、最悪AIに読んでもらってください。

```powershell
$ErrorActionPreference = "Stop"

# 変数定義
$OC = Join-Path $env:USERPROFILE ".config\opencode"
$ECC = Join-Path $env:USERPROFILE "ECC"
$Repo = "https://github.com/affaan-m/ECC.git"

# OpenCode用ディレクトリ作成
New-Item -ItemType Directory -Force "$OC\skills", "$OC\commands", "$OC\agents" | Out-Null

# ECC最新版取得
if (Test-Path "$ECC\.git") {
  git -C $ECC pull --ff-only
}
elseif (Test-Path $ECC) {
  throw "$ECC は既に存在しますが、Gitリポジトリではありません。削除またはリネームしてください。"
}
else {
  git clone $Repo $ECC
}

# ディレクトリの中身を丸ごとコピーする関数
function Copy-DirContent($From, $To) {
  if (Test-Path $From) {
    Copy-Item "$From\*" $To -Recurse -Force
  }
}

# skillsとcommandsは丸ごとコピー
Copy-DirContent "$ECC\skills" "$OC\skills"
Copy-DirContent "$ECC\.agents\skills" "$OC\skills"
Copy-DirContent "$ECC\commands" "$OC\commands"

# agentsはClaude Code用frontmatterをOpenCode用に変換
Get-ChildItem "$ECC\agents" -Filter "*.md" -File | ForEach-Object {
  $raw = Get-Content $_.FullName -Raw
  $name = $_.BaseName

  $description = "Imported from ECC: $name"
  $body = $raw
  $frontmatter = ""

  if ($raw -match '(?s)\A---\s*\r?\n(.*?)\r?\n---\s*\r?\n?(.*)\z') {
    $frontmatter = $Matches[1]
    $body = $Matches[2]

    if ($frontmatter -match '(?m)^description:\s*(.+)$') {
      $description = $Matches[1].Trim().Trim('"')
    }
  }

  # Claude Code側のtools指定から、OpenCode側のpermissionをざっくり決める
  $editPermission = if ($frontmatter -match '(?i)\b(Write|Edit|MultiEdit)\b') { "ask" } else { "deny" }
  $bashPermission = if ($frontmatter -match '(?i)\bBash\b') { "ask" } else { "deny" }

  # YAMLのdescriptionとして安全に入れるためJSON文字列化する
  $descriptionYaml = $description | ConvertTo-Json -Compress

  $converted = @"
---
description: $descriptionYaml
mode: subagent
permission:
  read: allow
  glob: allow
  grep: allow
  edit: $editPermission
  bash: $bashPermission
---

$body
"@

  Set-Content -Path "$OC\agents\$name.md" -Value $converted -Encoding UTF8
}

# skillを使えるようにする最低限のopencode.json
$Config = Join-Path $OC "opencode.json"

if (-not (Test-Path $Config)) {
@'
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "skill": {
      "*": "allow"
    }
  }
}
'@ | Set-Content -Path $Config -Encoding UTF8
}

Write-Host "Done: $OC"
```

## WSL / Linux / macOSで一発導入する場合

WSL、Linux、macOSでOpenCodeを使っている場合は、PowerShellではなくbashで実行します。

```bash
#!/usr/bin/env bash
set -euo pipefail

# 変数定義
OC="$HOME/.config/opencode"
ECC="$HOME/ECC"
REPO="https://github.com/affaan-m/ECC.git"

# OpenCode用ディレクトリ作成
mkdir -p "$OC/skills" "$OC/commands" "$OC/agents"

# ECC最新版取得
if [ -d "$ECC/.git" ]; then
  git -C "$ECC" pull --ff-only
elif [ -e "$ECC" ]; then
  echo "$ECC は既に存在しますが、Gitリポジトリではありません。削除またはリネームしてください。" >&2
  exit 1
else
  git clone "$REPO" "$ECC"
fi

# ディレクトリの中身を丸ごとコピーする関数
copy_dir_content() {
  local from="$1"
  local to="$2"

  if [ -d "$from" ]; then
    mkdir -p "$to"
    cp -R "$from/." "$to/"
  fi
}

# skillsとcommandsは丸ごとコピー
copy_dir_content "$ECC/skills" "$OC/skills"
copy_dir_content "$ECC/.agents/skills" "$OC/skills"
copy_dir_content "$ECC/commands" "$OC/commands"

# agentsはClaude Code用frontmatterをOpenCode用に変換
python3 - "$ECC/agents" "$OC/agents" <<'PY'
import json
import re
import sys
from pathlib import Path

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
dst.mkdir(parents=True, exist_ok=True)

if not src.exists():
    sys.exit(0)

frontmatter_re = re.compile(r"\A---\s*\r?\n(.*?)\r?\n---\s*\r?\n?(.*)\Z", re.S)

for path in sorted(src.glob("*.md")):
    raw = path.read_text(encoding="utf-8")
    name = path.stem

    description = f"Imported from ECC: {name}"
    frontmatter = ""
    body = raw

    match = frontmatter_re.match(raw)
    if match:
        frontmatter = match.group(1)
        body = match.group(2)

        desc_match = re.search(r"(?m)^description:\s*(.+)$", frontmatter)
        if desc_match:
            description = desc_match.group(1).strip().strip('"').strip("'")

    # Claude Code側のtools指定から、OpenCode側のpermissionをざっくり決める
    edit_permission = "ask" if re.search(r"\b(Write|Edit|MultiEdit)\b", frontmatter, re.I) else "deny"
    bash_permission = "ask" if re.search(r"\bBash\b", frontmatter, re.I) else "deny"

    converted = f"""---
description: {json.dumps(description, ensure_ascii=False)}
mode: subagent
permission:
  read: allow
  glob: allow
  grep: allow
  edit: {edit_permission}
  bash: {bash_permission}
---

{body}
"""

    (dst / f"{name}.md").write_text(converted, encoding="utf-8")
PY

# skillを使えるようにする最低限のopencode.json
CONFIG="$OC/opencode.json"

if [ ! -f "$CONFIG" ]; then
  cat > "$CONFIG" <<'JSON'
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "skill": {
      "*": "allow"
    }
  }
}
JSON
fi

echo "Done: $OC"
```

ファイルを作成して実行するなら、例えば次のようにします。別に`nano`の代わりに`vim`を使おうが何しようが好きにしてください。

```bash
nano install-ecc-opencode.sh
chmod +x install-ecc-opencode.sh
./install-ecc-opencode.sh
```

または、ファイル化せずにターミナルへそのまま貼り付けても動きます。

## Pythonがない場合

このbash版は、agentsの変換に `python3` を使っています。
WSLや多くのLinux環境では最初から入っていることが多いですが、macOSや最小構成のLinuxでは入っていない場合があります。

入っているかどうかはこれで確認できます。

```bash
python3 --version
```

なかった場合の入れ方は以下です。

**Ubuntu / WSL**

```bash
sudo apt update
sudo apt install -y python3
```

**macOS(Homebrew)**

```bash
brew install python
```

---

## このスクリプトでやっていること

やっていることは単純です。

```txt id="ktin5g"
ECC\skills          → .config\opencode\skills
ECC\.agents\skills  → .config\opencode\skills
ECC\commands        → .config\opencode\commands
ECC\agents\*.md     → .config\opencode\agents\*.md に変換して配置
```

skillsとcommandsは、そのままコピーで問題ありません。

agentsだけは、Claude CodeとOpenCodeで書き方が違うため、少し加工しています。

Claude Code用agentには、たとえば次のようなfrontmatterがあります。

```yaml id="3svdvn"
---
name: architect
description: Software architecture specialist for system design, scalability, and technical decision-making.
tools: ["Read", "Grep", "Glob"]
model: opus
---
```

OpenCodeでは、agent名は基本的にファイル名から決まります。
そのため、`name` は削っています。

また、Claude Codeの `tools` はOpenCodeの `permission` とはそのまま互換ではありません。そこで、ざっくり次のように変換しています。

```txt id="cqr7cd"
Read / Grep / Glob → read / grep / glob を allow
Write / Edit / MultiEdit がある → edit を ask
Write / Edit / MultiEdit がない → edit を deny
Bash がある → bash を ask
Bash がない → bash を deny
```

`model: opus` もそのままではOpenCodeのモデル指定としては扱いにくいので、コピーしていません。モデルを固定したい場合は、あとでOpenCode側のagent設定に手で追加したほうが安全です。

## パスについて

WindowsでPowerShellからOpenCodeを使う場合、今回入れたスキルとかその他設定はここにあります。

```txt
C:\Users\<Windowsユーザー名>\.config\opencode\
```

WSL内でOpenCodeを使う場合は、通常ここです。

```txt
/home/<WSLユーザー名>/.config/opencode/
```

この2つは同じではありません。

Windows側の `C:\Users\<Windowsユーザー名>\.config\opencode\` をWSLから見るなら、通常は次です。

```txt id="f2zswx"
/mnt/c/Users/<Windowsユーザー名>/.config/opencode/
```

つまり、WSLでOpenCodeを起動するなら、基本的にはWSL側の `~/.config/opencode` に入れる必要があります。
Windows側のPowerShellでOpenCodeを起動するなら、Windows側の `%USERPROFILE%\.config\opencode` に入れます。

ここを混ぜると、「コピーしたのにOpenCodeに反映されない」という地味な沼に入ります。

## どちらでやるべきか

> [!WARNING] ここの内容について
> このセクションはAIが書きましたが、検証していません。好みでいいと思います。というか、Opencode自体まだそこまで深く使いこなせてません。てへ。

私のおすすめはこうです。

| 状況                                  | おすすめ          |
| ------------------------------------- | ----------------- |
| WSL上で開発している                   | WSL               |
| GitやNode.jsもWSL側に寄せている       | WSL               |
| Windows側のプロジェクトを直接触りたい | Windowsネイティブ |
| PowerShellやWindowsパスに慣れている   | Windowsネイティブ |
| よくわからない                        | WSL               |

AIコーディングツールは、シェルコマンドをかなり使います。
そのため、WindowsネイティブだとPowerShell、cmd、Git Bash、パス区切り、文字コードあたりで微妙に引っかかることがあります。

WSLなら、多くのAIツールやOSSの説明と同じノリで扱えるので、手間は少ないです。…らしい。ふーん。

## やってはいけないこと

ECCのディレクトリをそのままOpenCodeの設定ディレクトリとして指定すると、OpenCodeの設定構造とECC側の構造が一致せず、設定エラーになります。

```powershell
$env:OPENCODE_CONFIG_DIR = "$env:USERPROFILE\ECC"
opencode
```

私の環境では、だいたい次のようなエラーが出ていました。

```txt
ConfigInvalidError
config.providers
provider.list
app.agents
config.get
```

`OPENCODE_CONFIG_DIR` は「何でも置けば勝手に吸収してくれる魔法の入口」ではありません。
OpenCode用の設定ディレクトリとして妥当な構造になっている必要があります。

つまり、ECCを丸ごと向けるのではなく、OpenCodeが読める場所に必要なものだけ移すのが正解です。

## 各種拡張の使い方

### commandsを使いたい場合

OpenCodeのcustom commandは、次の場所に置きます。

Windowsネイティブなら次です。

```txt
C:\Users\<ユーザー名>\.config\opencode\commands\plan.md
```

WSLなら次です。

```txt
~/.config/opencode/commands/plan.md
```

例えば、WindowsネイティブならPowerShellでこう作れます。

```powershell
@'
---
description: 実装前に計画を立てる
---

これから実装する内容を確認し、作業計画を作成してください。
変更はまだ行わず、影響範囲・確認コマンド・リスクを整理してください。
'@ | Set-Content -Encoding UTF8 "$OC\commands\plan.md"
```

これでOpenCode上から次のように呼び出せます。

```txt
/plan
```

注意点として、`commands` ディレクトリを作ったから `/commands` ができるわけではありません。

```txt
commands\plan.md    → /plan
commands\review.md  → /review
commands\test.md    → /test
```

という対応です。

### agentsを使いたい場合

agentは次の場所に置きます。

Windowsネイティブなら次です。

```txt
C:\Users\<ユーザー名>\.config\opencode\agents\code-reviewer.md
```

WSLなら次です。

```txt
~/.config/opencode/agents/code-reviewer.md
```

例えばコードレビュー用のagentならこうです。

```md
---
description: Reviews code for correctness, maintainability, and security issues
mode: subagent
permission:
  edit: deny
---

You are a code reviewer.
Focus on correctness, maintainability, security, and unnecessary complexity.
Do not modify files.
Report findings with concrete file references and suggested fixes.
```

レビュー専用なら、`edit: deny` にしておくと安心です。
勝手にファイルを変更せず、指摘だけしてもらえます。

### AGENTS.mdを書く

OpenCodeに常時読ませたい指示は、`AGENTS.md` に書きます。

Windowsネイティブなら次です。

```txt
C:\Users\<ユーザー名>\.config\opencode\AGENTS.md
```

WSLなら次です。

```txt
~/.config/opencode/AGENTS.md
```

最初はこれくらいで十分です。

```md
# Global OpenCode Instructions

When a request matches an installed skill, use the skill tool before implementing.

Prefer reading the relevant project files before editing.

For non-trivial changes:
1. Summarize the intended change.
2. Identify affected files.
3. Make the smallest reasonable edit.
4. Run available checks when practical.

Do not perform destructive operations without explicit confirmation.
```

ECCのルールをいきなり全部入れるのはおすすめしません。
グローバルルールを重くしすぎると、どのプロジェクトでも同じ作法が発動して扱いにくくなります。

プロジェクト固有のルールは、各リポジトリ側の `AGENTS.md` に書くほうが管理しやすいです。

## Windowsで詰まりやすいところ

### パス区切りが混ざる

Windowsでは `\`、WSLでは `/` を使います。

```txt
Windows: C:\Users\abc\.config\opencode
WSL:     /home/abc/.config/opencode
```

記事やREADMEがLinux前提だと、ほとんど `/home/...` や `~/.config/...` で書かれています。
Windowsネイティブで使う場合は、適宜 `C:\Users\<ユーザー名>\.config\opencode` に読み替えます。

### PowerShellとbashのコマンドが違う

Linux向けの記事に出てくる次のようなコマンドは、PowerShellではそのまま使えません。

```bash
mkdir -p ~/.config/opencode/skills
cp -r source dest
cat > file <<'EOF'
```

PowerShellでは、だいたい次のように書き換えます。

```powershell
New-Item -ItemType Directory -Force "$OC\skills" | Out-Null
Copy-Item -Recurse -Force $source $dest
Set-Content -Encoding UTF8 $path $content
```

この変換が面倒なら、WSLでやったほうが楽です。

### Windows側とWSL側の設定は別物

WindowsネイティブのOpenCodeと、WSL内のOpenCodeは、基本的に別の設定を読みます。

```txt
Windows: C:\Users\<ユーザー名>\.config\opencode\
WSL:     /home/<ユーザー名>/.config/opencode/
```

Windows側に設定したのに、WSLで起動したOpenCodeに反映されない、ということが普通に起きます。
逆も同じです。

まず、自分がどちらのOpenCodeを起動しているか確認したほうがいいです。

## 沼ポイントまとめ

### ECCを丸ごと設定ディレクトリにしない

やっても効きません。フォーマットが違うんだもん。

### 最初から全部入れない

ECCは便利ですが、全部入れると挙動が読みにくくなります。ちょっとずつ入れよう！

### WindowsネイティブとWSLを混ぜない

Windows側でOpenCodeを起動するなら、Windows側の設定に置きます。WSL側でOpenCodeを起動するなら、WSL側の設定に置きます。

ここを混ぜると、「設定したのに反映されない」という地味な沼に入ります。

## おわりに

ECCをOpenCodeで使うこと自体は、この通りやれば多分できます。もしかすると便利になるかもしれないので、暇だったらやってみる価値はあります。

貧民にとって枠は貴重です。できるだけ賢く働いてもらえるよう、先人の知恵は恥じずにガンガン乞食しましょう。