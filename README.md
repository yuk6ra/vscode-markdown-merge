今後AIで要件定義書を作成する際、複数のMarkdownファイルを一つのドキュメントにまとめることが必要になるかもしれません。そこで、以下のような機能を持つツールがあると便利です。

フォルダ指定: docs/ など、特定のディレクトリを右クリックして「Merge All Markdown」を選択。

ファイル順序の制御: ファイル名順、作成日順、または index.json 等で指定した順序で結合。

目次の自動生成: 結合後の冒頭に、各ファイルへのアンカーリンク付き目次を挿入。

パスの補正: 画像などの相対パスが壊れないよう、結合時にパスを自動調整。


```
.
├── data-pipeline.md
├── hardware-requirements.md
├── materials
│   └── seq.md
├── project-schedule.md
├── README.md
├── sequence.md
└── validation-backlog.md
```