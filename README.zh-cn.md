<div align="center">

[![](./images/logo.png "logo")](https://github.com/lvboda/vscode-img-fast)

# Img Fast

[![](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/lvboda/vscode-img-fast)  [![](https://badgen.net/github/license/lvboda/vscode-img-fast?color=green)](./LICENSE)  [![](https://badgen.net/vs-marketplace/i/lvboda.vscode-img-fast?color=orange)](https://marketplace.visualstudio.com/items?itemName=lvboda.vscode-img-fast)  [![](https://badgen.net/vs-marketplace/v/lvboda.vscode-img-fast?color=orange)](https://marketplace.visualstudio.com/items?itemName=lvboda.vscode-img-fast)

一个可以快速上传剪切板图片并获取图片 URL 的 vscode 插件。

[**English**](./README.md) **|** **简体中文**

</div>

![](./images/demo.gif "演示")

## 功能

- 支持windows/macOS操作系统
- 支持截图粘贴上传
- 支持单/多文件粘贴上传
- 支持单/多文件删除（云端删除）
- 支持自定义上传、删除快捷键
- 理论上支持一切以 `multipart/form-data` 类型传输的接口，如 `smms/vgy.me` 图床的接口

## 安装

在 vscode 扩展市场搜索 `Img Fast` ，点击 install 进行安装，或者使用快捷键 `ctrl + p` 并在输入框输入 `ext install img-fast` 。

## 使用

1. 首先完善配置项，其中 `authorization` 、 `uploadUrl` 、 `uploadMethod` 、`uploadFormDataKey` 这几项必须设置，否则无法上传。

2. 截图或复制图片文件粘贴至文档中就可以自动调用 `uploadUrl` 设置的接口进行文件上传了。（也可以 [自定义上传快捷键](#自定义命令快捷键)）

## 配置

- **openPasteAutoUpload**：是否开启粘贴自动上传剪切板图片功能。（默认开启）
- **openDeleteHover**：是否开启删除悬浮窗口。（默认开启）
- **authorization**：请求头里 `Authorization` 的token值。
- **imgRename**：上传前的文件重命名格式。 [查看所有参数](#命名参数)
- **outputRename**：上传后输出 URL 的重命名。 [查看所有参数](#命名参数)
- **uploadUrl**：上传接口。
- **uploadMethod**：上传接口的请求方法。
    - GET
    - POST
    - PUT
    - PATCH
    - DELETE
- **uploadFormDataKey**：上传接口 formData 的键，一般为 file 或 img。
- **uploadedKey**：上传成功后响应体 json 数据里 URL 的键。（如果为空则匹配第一个 URL）
- **deleteUrl**：删除接口。（如果为空则不开启删除功能）
- **deleteMethod**：删除接口的请求方法。
    - GET
    - POST
    - PUT
    - PATCH
    - DELETE
- **deleteQueryKey**：删除接口参数的key。
  - 如果该项不为空拼接的 URL 示例： `${deleteUrl}?${deleteQueryKey}=${图片名}` 。（图片名匹配规则请查看 [命令执行流程](#命令执行流程)）
  - 如果该项为空拼接的 URL 示例： `${deleteUrl}/${图片名}` 。
- **img-fast.deletedFlag**：调用删除接口后的操作。
    - **none**：什么也不做。
    - **url**：删除文档里对应的图片 URL。
    - **layout**：删除文档里对应的整个图片的框架，`![](${url})` 或 `<img src="${url}"/>` 。

### 命名参数
| 参数名  | 值  | 说明 |
|---|---|---|
| `hash` | ebf1649c4a5e29e7efa2dd0db8d191a... | 文件的md5值 32位 |
| `basename` | screenshot.png | 图片原名（带后缀） |
| `name` | screenshot | 图片原名（不带后缀） |
| `format` | png | 图片后缀 |
| `path` |  /Users/xx/Desktop/screenshot.png | 图片物理路径 |
| `url` | https:/xx.xxx.com/xx/screenshot.png | 图片上传后的 URL（上传前为空） |
| `beforeUploadPath` | /Users/xx/Desktop/2022-11-31-screenshot.png | 图片上传前路径 |
| `beforeUploadName` | 2022-11-31-screenshot.png | 图片上传前名称 |
| `timestamp` | 1669721343072 | 当前的时间戳 |
| `yyyy` | 2022 | 当前年份 |
| `MM` | 11 | 当前月份 |
| `dd` | 31 | 当前日期 |
| `hh` | 12 | 当前小时 |
| `mm` | 00 | 当前分钟 |
| `ss` | 00 | 当前秒钟 |
| `S` | 737 | 当前毫秒 |
| `q` | 4 | 当前季度 |

## 命令

### 命令执行流程

#### img-fast.upload

1. 判断 `uploadUrl` 配置，如果为空则终止该命令。
2. 获取当前剪切板的所有图片。
3. 根据 `imgRename` 配置进行命名并存储到插件目录下的 images 临时目录。
4. 调用 `uploadUrl` 配置的上传接口上传，多张图片则依次调用。
5. 调用成功后根据 `uploadedKey` 配置进行响应体 json 数据的匹配。
6. 根据 `outputRename` 配置将 URL 输出到文档中。

#### img-fast.delete

1. 判断 `deleteUrl` 配置，如果为空则终止该命令。
2. 如果有选中的文本则匹配选中文本中的所有 URL 的图片名，如果没有选中则匹配当前光标所在行文本的第一个 URL 的图片名。
   -  URL 为 http:/lvboda.cn/screenshot.png 匹配 screenshot.png。 
   -  URL 为 http:/lvboda.cn/screenshot 匹配 screenshot。
3. 根据 `deleteQueryKey` 和 `deleteUrl` 配置进行 URL 拼接，关于拼接规则请 [查看配置](#配置)。
4. 调用拼接好的 URL 进行删除操作。
5. 调用成功后如果有选中文本则删除选中的文本，如果没有选中文本则根据 `deletedFlag` 配置进行后续操作，关于 `deletedFlag` 请 [查看配置](#配置)。

### 自定义命令快捷键

本插件默认开启粘贴图片自动上传和点击悬浮在 URL 上的链接进行删除。其核心功能都是调用 `img-fast.upload` 和 `img-fast.delete` 这两个命令，所以完全可以用自定义快捷键调用命令的形式完成。

点击`文件 -> 首选项 -> 键盘快捷方式 -> 打开键盘快捷方式(json)` 或使用快捷键 `ctrl + shift + p -> 输入Keyboard` 进入 keybindings.json 文件中，在 json 文件的数组中添加以下配置，`key` 替换为你想设置的快捷键。

```json
{
    "key": "ctrl+alt+p",
    "command": "img-fast.upload",
    "when": "editorTextFocus",
},
{
    "key": "ctrl+alt+d",
    "command": "img-fast.delete",
    "when": "editorTextFocus",
}
```

添加完保存即可。

> 因为默认功能的实现是监听文本的变化来控制执行命令的，所以可能会出现一些无法预估的问题，更推荐自定义按键这种形式。在自定义按键后把 `openPasteAutoUpload` 设置为false，使其关闭默认功能，避免引起不必要的冲突。

## 其他

其他图床的 api 可能和本插件不适配，比如用 github 做图床，图片是通过 base64 编码以字符串的方式传输的，作为一个轻量化的插件，没有办法适配所有的图床。（后续会考虑以配置js文件的形式适配其他图床）

推荐使用自定义图床，我这里提供可适配插件的上传、删除服务，直接[下载](https://github.com/lvboda/file-upload-server/releases)就可以部署使用，只需要准备一台服务器即可。（后续可能会出一篇服务器与部署相关的文章详细说明）

如果因为网络或其他原因导致上传时间很长，您可以继续编写文档，上传成功后会插入到上传前光标的位置，不会覆盖掉之后的文本。

为了 vscode 加载速度，本插件只在 markdown 文档中才会激活，如果您想在其他类型文件中使用插件，请先打开一个 `.md` 文件使插件激活后再使用。

## 赞助

如果本插件对您有帮助的话，欢迎打赏～

<div align="center">
    <img width="20%" src="./images/wechat-qrcode.png"/>
    &nbsp;&nbsp;&nbsp;&nbsp;
    <img width="20%" src="./images/alipay-qrcode.png"/>
</div>

## 许可

[MIT](./LICENSE)

Copyright (c) 2022 - Boda Lü