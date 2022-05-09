/**
 * 拼接对象为请求字符串
 * 对于需要编码的文本（比如说中文）我们要进行编码
 * @param {Object} obj - 待拼接的对象
 * @returns {string} - 拼接成的请求字符串
 **/
export function formatGetUri(obj) {
  const params = []
  Object.keys(obj).forEach((key) => {
    let value = obj[key]
    if (typeof value !== 'undefined' || value !== null) {
      params.push([key, encodeURIComponent(value)].join('='))
    }
  })
  return '?' + params.join('&')
}
// /**
//  * 函数节流
//  * @param {function} func - 需要节流的函数
//  * @param {number} delay - 执行延迟
//  **/
// export function throttle(func, delay) {
//     let timeout;
//     return function() {
//         let context = this;
//         let args = arguments;
//         if (!timeout) {
//             timeout = setTimeout(() => {
//                 timeout = null;
//                 func.apply(context, args)
//             }, delay)
//         }

//     }
// }

/**
 * 函数节流
 * @param {function} func - 需要节流的函数
 * @param {number} delay - 执行延迟
 **/
export function throttle(func, delay) {
    let previous = 0;
    return function() {
        let now = Date.now();
        let context = this;
        let args = arguments;
        if (now - previous > delay) {
            func.apply(context, args);
            previous = now;
        }
    }
}

/**
 * 
 * @param {obj} point - 点 {x,y}
 * @param {obj} rect - 矩形 {x,y,w,h}
 **/
export function pointInRect(point, rect) {
    return point.x > rect.x && point.x < rect.x + rect.w && point.y > rect.y && point.y < rect.y + rect.h
}