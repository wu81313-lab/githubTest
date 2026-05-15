# PackyAPI Balance Desktop

Windows 桌面余额监控工具，用于打开并读取 PackyAPI 钱包页面中的当前余额。

## 功能

- 显示 PackyAPI 当前余额
- 每 30 秒自动同步一次，也支持手动刷新
- 内置登录窗口，使用 Electron 独立会话保存登录态
- 支持 Windows 开机自启动开关
- 支持构建 Windows NSIS 安装包

## 使用

```powershell
npm install
npm start
```

首次运行后，点击应用内的“登录 / 授权”，登录 PackyAPI。登录完成后关闭登录窗口，应用会自动同步余额。

## 构建

```powershell
npm run build
```

安装包会生成到 `dist/PackyAPI Balance Setup 0.1.0.exe`。

## 测试

```powershell
npm test
```
