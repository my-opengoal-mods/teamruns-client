const { contextBridge, ipcRenderer } = require("electron");
   
const validIpcChannelsIn = [
    "og-start-repl",
    "og-start-game",
    "og-command",
    "window-close",
    "window-minimize",
    "file-fetch",
    "settings-read",
    "settings-write",
    "settings-select-path",
    "settings-reset-size",
    "update-check",
    "update-install"
];
const validIpcChannelsOut = [
    "og-launched",
    "backend-message",
    "backend-error",
    "file-get",
    "settings-get",
    "settings-get-path",
    "update-available",
    "update-progress",
    "update-downloaded"
];


contextBridge.exposeInMainWorld("electron", {
    send: (channel, data) => {
        if (validIpcChannelsIn.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        if (validIpcChannelsOut.includes(channel)) {
            const subscription = (event, ...args) => func(...args);
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, subscription);
            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        }
    }
});
    