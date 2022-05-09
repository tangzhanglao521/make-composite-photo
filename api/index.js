import request from '../common/request.js'
import { formatGetUri } from '../common/util.js'

const api = {}
const PORT1 = 'api'
// POST请求方式 POST//必须大写，为了兼容其他应用
// api.uploadImgApi = params => request.globalRequest(`${PORT1}/wx/image`, 'POST', params, 1) // 
// GET请求方式
api.register = params => request.globalRequest(`${PORT1}/sign/${formatGetUri(params)}`, 'GET //必须大写，为了兼容其他应用',{}, 1)
export default api