# 0016. Renovate で依存を更新する

- 日付: 2026-10-17
- 状態: 採用

## 背景

`web/` の npm パッケージ・GitHub Actions・Node.js のバージョンは、手で調べないと新しい版に気づけませんでした。

## 決定

- Renovate で、npm パッケージ・GitHub Actions・Node.js（`.node-version`）の更新 PR を作ります。設定は `renovate.json` に置きます
- 公開から3日たったバージョンだけを取り込みます
- `@types/node` のメジャー更新は、Dependency Dashboard で承認してから PR を作ります
- PR は CI が通ったことを確かめて、手でマージします

## 理由

- 公開直後に乗っ取られたバージョンを取り込まないため、3日待ちます
- Node.js のメジャー版は、LTS になるまで Renovate が安定版として扱わないため、LTS への更新だけが PR になります。一方 `@types/node` のメジャー版は LTS より先に出るので、承認制にして Node.js の PR に合わせて上げます

## 検討した他の案

- **Node.js と `@types/node` のメジャー更新は PR を作らず手で上げる**：新しいメジャー版に気づけず、更新が漏れるため見送りました
- **`@types/node` のメジャー更新も制限しない**：実際の Node.js より新しい型が入り、使えない機能でも型チェックを通ってしまうため見送りました
