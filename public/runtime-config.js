// 运行时配置文件
// 此文件位于 public/ 目录，Vite 不会处理它的内容，构建后会原样复制到 dist 根目录。
// 部署后如果需要更换后端地址，直接修改这一个文件即可，不需要重新构建整个前端。

window.__MCSM_CONFIG__ = {
  // 留空（""）表示前端与后端同源，即当前行为不变：
  //   /api/xxx 会被解析为当前访问域名下的路径（例如 https://mcsm.qicwken.top/api/xxx）
  //
  // 如果前端和后端不在同一个域名/端口下，在这里填后端面板的完整地址（不要带结尾斜杠）：
  //   apiBase: "https://backend.example.com"
  apiBase: ""
};
