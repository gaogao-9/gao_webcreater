# gao_webcreater
ES6とかSCSSとかそういうのを使ったせいてき(意味深)なウェブページを作成するgulp構成ごにょったオレオレ神開発環境

## 使い方
 1. git cloneとか、ZIP Downloadとかを駆使してこのプロジェクトを入手
 2. cd webcreaterしてpackage.jsonが入っているフォルダに移動
 3. npm installを実行。依存するライブラリを全部取ってきます（色々依存してるので結構時間かかる）
 4. mkdir srcでフォルダを作る
 5. srcの中に、htmlファイルを打ち込む。
 6. srcの中に、｢js｣と｢css｣というフォルダ名でフォルダを作る。それぞれcssやjsを打ち込む
 7. ES6をES5に変換したい場合「hoge.es6.js」とする。既にminifyされている素のJSファイルなんかは「fuga.min.js」とする
 8. SCSSをCSSに変換したい場合は｢hoge.scss｣とする。既にminifyされている素のCSSファイルなんかは「fuga.min.css」とする
 9. package.jsonが入ってるフォルダにある「projectPath.js」を開く
 10. 中身を、サンプルのように編集する。基本的には「html.ファイル名(拡張子抜き)」や「js.ファイル名(拡張子抜き)」のようにする
 11. gulpコマンドを打ち込む。監視だけしたい時は「gulp watch」。リリースビルドの時は「gulp compile」。
 12. 快適なウェブ開発ライフを

## Q&A
 - Q.入出力のフォルダ構成を設定したい
 - A.config.js
 - Q.このQ&Aとか説明とか雑じゃないっすか
 - A.仕様です

## 興味ある若者へ
 - このreadmeは役に立たないので何かわからないことあったら直接聞け(Twitter:@gaogao_9)
