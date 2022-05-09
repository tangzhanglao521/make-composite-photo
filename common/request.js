import urlConfig from './config.js'

const request = {}
const headers = {}
const PORT1 = '/api'
let token = ''
request.globalRequest = (url, method, data, power) => {
/*     权限判断 因为有的接口请求头可能需要添加的参数不一样，所以这里做了区分
    1 == 不通过access_token校验的接口
    2 == 文件下载接口列表
    3 == 登录 */
    switch (power){
        case 1:
		    headers['Content-Type'] = 'multipart/form-data'
			headers['token']  = `${uni.getStorageSync("token")}`
            break;
        case 2:
		    headers['token']  = `${uni.getStorageSync("token")}`
            break;
        case 3:
            break;
        default:
            headers['Authorization'] = `Bearer ${
                this.$store.getters.userInfo
            }`
            headers['TENANT-ID'] = this.$store.getters.userInfo.tenant_id
            break;
    }
    return uni.request({
        url: urlConfig + url,
        method,
        data: data,
        dataType: 'json',
        header: headers
    }).then(res => {
        if (res[1].data.code == 200) {
            return res[1].data
        } else {
            throw res[1].data
        }
    }).catch(parmas => {
　　　　　　switch (parmas.code) {
　　　　　　　　case 401:
　　　　　　　　　　uni.clearStorageSync()
　　　　　　　　　　break
　　　　　　　　default:
　　　　　　　　　　uni.showToast({
　　　　　　　　　　　　title: parmas.message,
　　　　　　　　　　　　icon: 'none'
　　　　　　　　　　})
　　　　　　　　　　return Promise.reject()
　　　　　　　　　　break
　　　　　　}
　　})
 } 

export default request