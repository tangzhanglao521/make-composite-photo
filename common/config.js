let url_config = ""

if(process.env.NODE_ENV === 'development'){
    // 开发环境
    url_config = 'http://10.121.176.12:8090/'
}else{
    // 生产环境
    url_config = 'https://canvas.cax.xyz/'
}

export default url_config