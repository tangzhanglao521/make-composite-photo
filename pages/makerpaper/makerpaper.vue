<template>
	<view>
		<nav-bar title="合成照片"></nav-bar>
		<view class="makerpaper">
			<!-- 隐藏canvas -->
			<canvas
				canvas-id="tempCanvas"
				:style="{
					width: '710rpx',
					height: totalHeight + 'px',
					position: 'absolute',
					left: '-99999px',
					top: '630rpx',
					background: '#fff',
				}"
			></canvas>
			<view class="swiper_content">
				<view class="swiper-inner">
					<view
						class="swiper-wrapcircle"
						@touchstart="handleMovableAreaTouchStart"
						@touchend="handleMovableAreaTouchEnd"
						@touchmove.stop="handleMovableAreaTouchMove"
					>
						<view
							class="drag-view"
							v-if="drag.show"
							:style="{
								left: `${drag.style.left}px`,
								top: `${drag.style.top}px`,
							}"
						>
							<image :src="drag.src" style="width: 100%; height: 100%"></image>
						</view>
						<image
							class="frame"
							:src="paperListTemplateChild[curInd].templalteImage"
							ref="imgHref"
							mode="widthFix"
						></image>
						<view
							class="pic-area"
							v-for="(item, index) in clickableArea"
							@click="addPhoto(index, imgsInfo[index])"
							:key="index"
							:style="{
								left: item.x * imgRadio + 'px',
								top: item.y * imgRadio + 'px',
								width: item.w * imgRadio + 'px',
								height: item.h * imgRadio + 'px',
							}"
							@touchstart="touchstartCallback($event, index)"
							@touchmove="touchmoveCallback($event, index)"
						>
							<view
								:style="{
									transform: `translate(${imgsInfo[index].x}px, ${imgsInfo[index].y}px)`,
									width:
										imgsInfo[index].initWidth * imgsInfo[index].scale + 'px',
									height:
										imgsInfo[index].initHeight * imgsInfo[index].scale + 'px',
								}"
								v-if="imgsInfo[index].path"
							>
								<image
									:src="imgsInfo[index].path"
									style="width: 100%; height: 100%"
								></image>
							</view>
							<view
								:class="{
									'add-photo': true,
									'dash-line': item.needDashLine,
								}"
								v-else
							>
								<image src="../../static/add.png"></image>
							</view>
						</view>
					</view>
				</view>
			</view>
			<view class="footer_bto">
				<view class="printing">
					<van-button round color="#FF4C4C" @click="handleprint" type="danger"
						>制作</van-button
					>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { throttle, pointInRect } from "@/common/util.js";
export default {
	components: {
	},
	data() {
		return {
			// 拖动图片时的
			drag: {
				show: false,
				src: "",
				style: {
					left: 0,
					top: 0,
				},
			},
			paperListTemplateChild: [],
			curInd: 0,
			device: "",
			deviceRatio: "",
			totalHeight: 0,
			initRadio: 0,
			paperBoxId: 0,
			templateId: "",
			equipmentId: "",
			templateWidth: "",
			repeatBool: true,
			templateIndex: 0,
			paperId: "",
			clickableArea: [],
			imgRadio: 1, // 默认canvas和图片比例1比1
			bgImgsInfo: [], // 获取过信息的背景图片
			imgsInfo: [], // 用户选取的图片信息
			tempCtx: null,
			clickable: true,
		};
	},
	onLoad(options) {
		let self = this;
		let { paperId,  equipmentId, paperBoxId } = options;
		self.equipmentId = equipmentId;
		self.paperBoxId = paperBoxId;
		self.paperId = paperId;
		uni.setStorageSync("equipmentId", equipmentId);
		self.getPaperTemplatedInfo(paperId);
		this.tempCtx = wx.createCanvasContext("tempCanvas");
	},
	methods: {
		calcDistance(pos0, pos1) {
			let xMove = pos1.clientX - pos0.clientX;
			let yMove = pos1.clientY - pos0.clientY;
			return Math.sqrt(xMove * xMove + yMove * yMove);
		},
		touchstartCallback(e, index) {
			if (!this.imgsInfo[index]) return;
			// 单指是拖动
			if (e.touches.length == 1) {
				this.imgsInfo[index].lastX = e.touches[0].pageX;
				this.imgsInfo[index].lastY = e.touches[0].pageY;
				this.imgsInfo.splice(index, 1, this.imgsInfo[index]);
				this.scaleMode = false;
				return;
			}
			let distance = this.calcDistance(e.touches[0], e.touches[1]);
			this.imgsInfo[index].distance = distance;
			this.imgsInfo[index].lastScale = this.imgsInfo[index].scale;
			this.scaleMode = true;
		},
		touchmoveCallback(e, index) {
			if (!this.imgsInfo[index]) return;
			if (e.touches.length == 1) {
				if (this.scaleMode) return;
				let x =
					this.imgsInfo[index].x +
					(e.touches[0].pageX - this.imgsInfo[index].lastX) * 0.5;
				let y =
					this.imgsInfo[index].y +
					(e.touches[0].pageY - this.imgsInfo[index].lastY) * 0.5;
				this.imgsInfo[index].lastX = e.touches[0].pageX;
				this.imgsInfo[index].lastY = e.touches[0].pageY;
				if (x > 0) {
					x = 0;
				} else if (
					x <
					this.clickableArea[index].w * this.imgRadio -
						this.imgsInfo[index].initWidth * this.imgsInfo[index].scale
				) {
					x =
						this.clickableArea[index].w * this.imgRadio -
						this.imgsInfo[index].initWidth * this.imgsInfo[index].scale;
				}

				if (y > 0) {
					y = 0;
				} else if (
					y <
					this.clickableArea[index].h * this.imgRadio -
						this.imgsInfo[index].initHeight * this.imgsInfo[index].scale
				) {
					y =
						this.clickableArea[index].h * this.imgRadio -
						this.imgsInfo[index].initHeight * this.imgsInfo[index].scale;
				}

				this.imgsInfo[index].x = x;
				this.imgsInfo[index].y = y;
				this.imgsInfo.splice(index, 1, this.imgsInfo[index]);
				return;
			}
			let distance = this.calcDistance(e.touches[0], e.touches[1]);
			// 计算移动的过程中实际移动了多少的距离
			let distanceDiff = distance - this.imgsInfo[index].distance;
			let newScale = this.imgsInfo[index].lastScale + 0.01 * distanceDiff;

			if (newScale < 1) {
				newScale = 1;
			}
			console.log(
				this.imgsInfo[index].x,
				this.clickableArea[index].w * this.imgRadio -
					(this.imgsInfo[index].initWidth * newScale -
						Math.abs(this.imgsInfo[index].x))
			);
			if (newScale > 1) {
				if (
					this.imgsInfo[index].initWidth * newScale -
						Math.abs(this.imgsInfo[index].x) <
					this.clickableArea[index].w * this.imgRadio
				) {
					this.imgsInfo[index].x +=
						this.clickableArea[index].w * this.imgRadio -
						(this.imgsInfo[index].initWidth * newScale -
							Math.abs(this.imgsInfo[index].x));
				}
				if (
					this.imgsInfo[index].initHeight * newScale -
						Math.abs(this.imgsInfo[index].y) <
					this.clickableArea[index].h * this.imgRadio
				) {
					this.imgsInfo[index].y +=
						this.clickableArea[index].h * this.imgRadio -
						(this.imgsInfo[index].initHeight * newScale -
							Math.abs(this.imgsInfo[index].y));
				}
			}
			this.imgsInfo[index].scale = newScale;
		},
		touchendCallback(e) {
			console.log("end");
			if (e.touches.length == 0) {
				console.log("end", e);
				this.scaleMode = false;
			}
		},
		handleMovableAreaTouchStart(e) {
			if (e.touches.length > 1) {
				// 可能是缩放操作 禁止点击事件触发
				clearTimeout(this.timer);
				this.clickable = false;
			}
			if (this.clickableArea.length == 1) {
				return;
			}

			if (e.touches.length > 1) {
				return;
			}
			const relativeX = e.changedTouches[0].pageX - 20;
			const relativeY = e.changedTouches[0].pageY - 170;
			const rectRadio = (border) => {
				const x = border.x * this.imgRadio;
				const y = border.y * this.imgRadio;
				const w = border.w * this.imgRadio;
				const h = border.h * this.imgRadio;
				return {
					x,
					y,
					w,
					h,
				};
			};
			// relativeX是拖拽你元素左上角坐标 所以手指位置需要加元素宽度一半 this.px(50)
			const index = this.clickableArea.findIndex((rect) =>
				pointInRect(
					{
						x: relativeX,
						y: relativeY,
					},
					rectRadio(rect)
				)
			);

			if (this.imgsInfo[index]) {
				this.startDragIndex = index;
				this.startId = e.changedTouches[0].identifier;
				this.drag.src = this.imgsInfo[index].path;
			}
		},
		handleMovableAreaTouchMove: throttle(function (e) {
			if (this.clickableArea.length == 1) {
				return;
			}
			if (e.changedTouches.length > 1) {
				return;
			}
			const relativeX = e.changedTouches[0].pageX - 20;
			const relativeY = e.changedTouches[0].pageY - 170;
			const rectRadio = (border) => {
				const x = border.x * this.imgRadio;
				const y = border.y * this.imgRadio;
				const w = border.w * this.imgRadio;
				const h = border.h * this.imgRadio;

				return {
					x,
					y,
					w,
					h,
				};
			};
			// relativeX是拖拽你元素左上角坐标 所以手指位置需要加元素宽度一半 this.px(50)
			const index = this.clickableArea.findIndex((rect) =>
				pointInRect(
					{
						x: relativeX,
						y: relativeY,
					},
					rectRadio(rect)
				)
			);
			if (index !== this.startDragIndex && this.imgsInfo[this.startDragIndex]) {
				this.drag.show = true;
				this.drag.style.left = relativeX - this.px(50);
				this.drag.style.top = relativeY - this.px(50);
			} else {
				this.drag.show = false;
			}
		}, 50),
		handleMovableAreaTouchEnd(e) {
			if (this.clickableArea.length == 1) {
				return;
			}
			this.timer = setTimeout(() => {
				this.clickable = true;
			}, 350);
			const relativeX = e.changedTouches[0].pageX - 20;
			const relativeY = e.changedTouches[0].pageY - 170;
			const rectRadio = (border) => {
				const x = border.x * this.imgRadio;
				const y = border.y * this.imgRadio;
				const w = border.w * this.imgRadio;
				const h = border.h * this.imgRadio;
				return {
					x,
					y,
					w,
					h,
				};
			};
			// relativeX是拖拽你元素左上角坐标 所以手指位置需要加元素宽度一半 this.px(50)
			const index = this.clickableArea.findIndex((rect) =>
				pointInRect(
					{
						x: relativeX,
						y: relativeY,
					},
					rectRadio(rect)
				)
			);
			if (
				index != -1 &&
				index !== this.startDragIndex &&
				this.startDragIndex !== -1 &&
				this.startId == e.changedTouches[0].identifier
			) {
				const temp = this.imgsInfo[index];
				const { w, h } = this.clickableArea[index];
				const startImg = JSON.parse(
					JSON.stringify(this.imgsInfo[this.startDragIndex])
				);
				const imgR = startImg.width / startImg.height;
				const borderR = w / h;
				// 实现图片cover
				// 图片比例小于视口比例
				if (imgR <= borderR) {
					startImg.initWidth = w * this.imgRadio;
					startImg.initHeight = (w / imgR) * this.imgRadio;
				} else {
					// 图片比例大于视口比例
					startImg.initWidth = h * imgR * this.imgRadio;
					startImg.initHeight = h * this.imgRadio;
				}
				startImg.scale = 1;
				startImg.x = 0;
				startImg.y = 0; // 先设置一下 再剪切
				this.imgsInfo.splice(index, 1, startImg);

				if (temp) {
					const { w, h } = this.clickableArea[this.startDragIndex];
					const imgR = temp.width / temp.height;
					const borderR = w / h;
					// 实现图片cover
					// 图片比例小于视口比例
					if (imgR <= borderR) {
						temp.initWidth = w * this.imgRadio;
						temp.initHeight = (w / imgR) * this.imgRadio;
					} else {
						// 图片比例大于视口比例
						temp.initWidth = h * imgR * this.imgRadio;
						temp.initHeight = h * this.imgRadio;
					}
					temp.scale = 1;
					temp.x = 0;
					temp.y = 0; // 先设置一下 再剪切
					this.imgsInfo.splice(this.startDragIndex, 1, temp);
				}
			}
			this.startDragIndex = -1;
			this.drag.show = false;
		},
		addPhoto(num) {
			if (!this.clickable) {
				this.clickable = true;
				return;
			}
			var self = this;
			uni.chooseImage({
				count: 1,
				sourceType: ["album", "camera"], // 可以指定来源是相册还是相机，默认二者都有
				success: function (res) {
					uni.getImageInfo({
						src: res.tempFilePaths[0],
						success: function (re) {
							const { w, h } = self.clickableArea[num];

							const imgR = re.width / re.height;
							const borderR = w / h;
							// 实现图片cover
							// 图片比例小于视口比例
							if (imgR <= borderR) {
								re.initWidth = w * self.imgRadio;
								re.initHeight = (w / imgR) * self.imgRadio;
							} else {
								// 图片比例大于视口比例
								re.initWidth = h * imgR * self.imgRadio;
								re.initHeight = h * self.imgRadio;
							}
							re.scale = 1;
							re.x = 0;
							re.y = 0; // 先设置一下 再剪切
							self.imgsInfo.splice(num, 1, re);
						},
					});
				},
				fail: function (res) {},
			});
		},
		handleRoate() {
			uni.showToast({
				title: "正在开发中",
			});
		},
		handleRepeat() {
			this.repeatBool = false;
		},
		handleSave() {
			this.repeatBool = true;
		},
		px(rpx) {
			var px = (rpx / 750) * uni.getSystemInfoSync().windowWidth;
			return px;
		},
		rpxPx(px) {
			var rpx = (px / uni.getSystemInfoSync().windowWidth) * 750;
			return rpx;
		},
		getEquipInfo(src, cb) {
			var self = this;
			this.device = this.$myDevice;
			this.deviceRatio = this.device.windowWidth / 750;
			uni.getImageInfo({
				src,
				success(res) {
					let whRadio = res.width / res.height;
					self.templateWidth = self.px(710);
					self.totalHeight = self.templateWidth / whRadio;
					self.initRadio = res.width / (750 * self.deviceRatio); //保证宽度全显
					self.imgRadio = self.templateWidth / res.width;
					cb && cb(res);
				},
			});
		},
		handleprint() {
			this.save_img();
		},
		save_img() {
			var self = this;
			if (this.imgsInfo.filter((i) => i).length < this.clickableArea.length) {
				uni.showToast({
					title: "请上传照片",
					icon: "none",
				});
				return;
			}
			uni.showLoading({
				title: "保存中",
				mask: true,
			});
			var tempCtx = this.tempCtx;
			//先画照片
			this.imgsInfo.forEach((item, index) => {
				const border = this.clickableArea[index];
				const x = border.x * this.imgRadio;
				const y = border.y * this.imgRadio;
				const w = border.w * this.imgRadio;
				const h = border.h * this.imgRadio;
				tempCtx.save();
				tempCtx.rect(x, y, w, h);
				// tempCtx.clip()
				//tempCtx.globalCompositeOperation = 'source-atop' d
				tempCtx.translate(x, y);
				// 图片算上scale实际宽度 item.initWidth * (item.scale*item.scale)
				// 图片左边偏移 item.x
				// 图片剪切框的宽度  item.initWidth * (item.scale*item.scale) / w * item.with
				// console.log( (item.width / (item.initWidth * ((item.scale*item.scale)))), (item.height / (item.initHeight * ((item.scale*item.scale)))))
				tempCtx.drawImage(
					item.path,
					Math.abs(item.x) * (item.width / (item.initWidth * item.scale)),
					Math.abs(item.y) * (item.height / (item.initHeight * item.scale)),
					w * (item.width / (item.initWidth * item.scale)),
					h * (item.height / (item.initHeight * item.scale)),
					0,
					0,
					w,
					h
				);
				tempCtx.restore();
			});
			//再画相框覆盖上去
			uni.getImageInfo({
				src: self.paperListTemplateChild[self.templateIndex].templalteImage,
				success: function (res) {
					tempCtx.drawImage(res.path, 0, 0, self.px(710), self.totalHeight);
					tempCtx.draw();
					setTimeout(function () {
						uni.canvasToTempFilePath({
							width: 1520,
							height: 1020,
							x: 0,
							y: 0,
							destWidth: 1520,
							destHeight: 1020,
							canvasId: "tempCanvas",
							fileType: "png",
							quality: 1,
							success: function (res) {
								// 上传合成后的照片start
								var params = {
									templateId: self.templateId,
									paperBoxId: self.paperBoxId,
								};
								console.log(params, res);
								// 预览调试用start  上线注释掉即可
								uni.previewImage({
								  urls: [res.tempFilePath] // 需要预览的图片http链接列表
								})
								console.log(uni.getStorageSync("token"),'---token---')
								wx.getFileInfo({
								filePath:res.tempFilePath,
								  success (r) {
								    console.log(r.size,'-----------')
									uni.hideLoading();
									uni.showToast({
										title: "保存成功",
										icon: "succes",
										duration: 1000,
										mask: true,
									});
								  }
								})
								// 预览调试用end
								// 上传合成后的照片
							},
						});
					}, 200);
				},
			});
		},
		getPaperTemplatedInfo(id) {
				this.paperListTemplateChild = [
					{
					 border: '[{"x":144,"y":180,"w":320,"h":450},{"x":600,"y":180,"w":320,"h":450},{"x":1054,"y":180,"w":320,"h":450}]',
					 code: "A301012",
					 createTime: "",
					 id: 19,
					 paperCode: "301",
					 paperId: 1,
					 templalteImage: "https://static.tope365.com/english-student-page/canvas/A301012.png",
				  }];
				this.templateId = this.paperListTemplateChild[0].id;
				
				let clickableArea = JSON.parse(this.paperListTemplateChild[0].border
				);
				console.log(clickableArea)
				clickableArea = clickableArea.map((border, index) => {
					const needDashLine =
						clickableArea[index + 1] &&
						Math.abs(clickableArea[index + 1].x - (border.x + border.w)) <
							3;
					return {
						...border,
						key: Math.random(),
						needDashLine,
					};
				});
				this.clickableArea = clickableArea;
				this.getEquipInfo(
					this.paperListTemplateChild[this.templateIndex].templalteImage,
					(bgImgInfo) => {
						this.bgImgsInfo[0] = bgImgInfo;
					}
				);
						
		},

		swipclick(index, item) {
			this.curInd = index;
			this.templateIndex = index;
			this.templateId = this.paperListTemplateChild[index].id;
			let clickableArea = JSON.parse(this.paperListTemplateChild[index].border);
			clickableArea = clickableArea.map((border, index) => {
				const needDashLine =
					clickableArea[index + 1] &&
					Math.abs(clickableArea[index + 1].x - (border.x + border.w)) < 3;

				if (this.imgsInfo[index]) {
					const { w, h } = border;
					const re = this.imgsInfo[index];
					const imgR = re.width / re.height;
					const borderR = w / h;
					// 实现图片cover
					// 图片比例小于视口比例
					if (imgR <= borderR) {
						re.initWidth = w * this.imgRadio;
						re.initHeight = (w / imgR) * this.imgRadio;
					} else {
						// 图片比例大于视口比例
						re.initWidth = h * imgR * this.imgRadio;
						re.initHeight = h * this.imgRadio;
					}
					re.scale = 1;
					re.x = 0;
					re.y = 0; // 先设置一下 再剪切
					this.imgsInfo.splice(index, 1, re);
				}
				return {
					...border,
					key: Math.random(),
					needDashLine,
				};
			});
			this.clickableArea = clickableArea;
			
			this.getEquipInfo(
				this.paperListTemplateChild[index].templalteImage,
				(bgImgInfo) => {
					this.bgImgsInfo[index] = bgImgInfo;
				}
			);
		},
	},
};
</script>

<style lang="scss">
page {
	background: rgba(241, 241, 241, 1);
	width: 100%;
	height: 100%;

	.makerpaper {
		padding-top: 160rpx;

		.swiper_content {
			.img_canvas {
				width: 100%;
				box-sizing: border-box;
				padding: 0 20rpx;

				.img_bg {
					height: 476rpx;
					width: 710rpx;
					background: #fff;
					border-radius: 20rpx;
					background-size: 100% 100%;
				}
			}

			position: relative;

			.repeat_btn {
				position: absolute;
				top: -30rpx;
				left: 106rpx;
				width: 200rpx;
				height: 100rpx;
				background: rgba(255, 255, 255, 1);
				box-shadow: 0 9rpx 28rpx 8rpx rgba(0, 0, 0, 0.05),
					0 6rpx 16rpx 0px rgba(0, 0, 0, 0.08),
					0 3rpx 6rpx -4rpx rgba(0, 0, 0, 0.12);
				border-radius: 16rpx;
				display: flex;
				justify-content: space-around;
				z-index: 11;
				font-size: 26rpx;
				color: #999999;

				.repeat {
					margin-left: 20rpx;
					padding-top: 14rpx;
				}

				.roate {
					margin-right: 20rpx;
					padding-top: 14rpx;
				}

				image {
					width: 38rpx;
					height: 38rpx;
					margin-left: 8rpx;
					display: block;
				}
			}
		}

		.swiper-inner {
			box-sizing: border-box;
			padding: 0 20rpx;
			width: 100%;
			height: 480rpx;
			overflow: hidden;

			.frame {
				width: 100%;
				position: absolute;
				margin: 0;
				z-index: 4;
				pointer-events: none;
			}

			.swiper-wrapcircle {
				height: 476rpx;
				position: relative;

				.drag-view {
					position: absolute;
					width: 100rpx;
					height: 100rpx;
					background-color: #fff;
					overflow: hidden;
					z-index: 99999;
				}

				.pic-area {
					position: absolute;
					z-index: 3;
					overflow: hidden;

					// border-right: 1px dashed gray;
					movable-view {
						width: 100%;
						height: 100%;
					}

					.add-photo {
						position: absolute;
						display: flex;
						top: 0;
						right: 0;
						left: 0;
						bottom: 0;
						justify-content: center;
						align-items: center;
						background-color: #cccccc;

						image {
							width: 60px;
							height: 60px;
						}
					}

					.dash-line {
						border-right: 1px dashed #f8f8f8;
					}
				}
			}

			.swiper-wrap {
				height: 476rpx;
				position: relative;

				.add_photo {
					width: 100%;
					box-sizing: border-box;
					padding: 0 36rpx 0 24rpx;
					height: 476rpx;
					z-index: 1;

					movable-area {
						float: left;
						width: 217rpx;
						height: 476rpx;
						display: flex;
						overflow: hidden;
						justify-content: center;
						align-items: center;
						z-index: 2;
						position: relative;

						.photo_click {
							position: absolute;
							top: 120rpx;
							left: 50rpx;
							width: 125rpx;
							height: 125rpx;
							transform: rotate(45deg);
						}
					}
				}
			}

			.swiper-wraper {
				height: 476rpx;
				position: relative;

				.add_photo {
					width: 100%;
					box-sizing: border-box;
					padding: 0 30rpx 0 28rpx;
					height: 476rpx;
					z-index: 1;

					movable-area {
						float: left;
						height: 476rpx;
						overflow: hidden;
						position: relative;
						border: 100px solid blue;

						.photo_click {
							position: absolute;
							top: 90rpx;
						}

						&:first-child {
							width: 140rpx;

							.photo_click {
								left: 20rpx;
								width: 116rpx;
								height: 162rpx;
							}
						}

						&:nth-child(2) {
							width: 140rpx;

							.photo_click {
								left: 20rpx;
								width: 116rpx;
								height: 162rpx;
							}
						}

						&:nth-child(3) {
							width: 186rpx;

							.photo_click {
								left: 20rpx;
								width: 162rpx;
								height: 232rpx;
							}
						}

						&:nth-child(4) {
							width: 186rpx;

							.photo_click {
								left: 20rpx;
								width: 162rpx;
								height: 232rpx;
							}
						}
					}
				}
			}
		}

		.use_tip {
			font-size: 32rpx;
			color: #999999;
			text-align: center;
			height: 45rpx;
			line-height: 45rpx;
			margin-top: 80rpx;
		}

		/*选中时候的样式 */
		.paper_mode {
			height: 244rpx;
			width: 100%;
			position: absolute;
			bottom: 120rpx;

			.paper_iframe {
				width: 100%;
				height: 200rpx;
				margin-top: 44rpx;
				display: flex;
				background: #f9f9f9;
				box-sizing: border-box;
				padding: 0 36rpx;

				.model_list {
					width: 180rpx;
					height: 120rpx;
					margin-top: 32rpx;
					border: 4px solid #f9f9f9;
					position: relative;

					&.active {
						border: 4px solid rgba(254, 70, 99, 1);
						position: relative;

						&:before {
							content: "";
							position: absolute;
							height: 44rpx;
							width: 88rpx;
							background: #f9f9f9;
							top: -78rpx;
							border-top-left-radius: 10rpx;
							border-top-right-radius: 10rpx;
						}

						&:after {
							content: "";
							height: 44rpx;
							width: 88rpx;
							position: absolute;
							top: -78rpx;
							left: 0;
							background: url(../../static/icon_xiajiantou@2x.png) no-repeat
								center center;
							background-size: 40rpx 35rpx;
						}
					}

					.card_shortage {
						position: absolute;
						top: -20rpx;
						right: -20rpx;
						width: 40rpx;
						height: 40rpx;
						background: #fe4663;
						border-radius: 50%;
						font-size: 26rpx;
						text-align: center;
						color: #fff;
						z-index: 999;
					}
				}

				.model_icon {
					width: 100%;
					height: 100%;
				}
			}
		}

		.footer_bto {
			width: 100%;
			height: 120rpx;
			background: #fff;
			position: absolute;
			display: flex;
			justify-content: space-between;
			box-sizing: border-box;
			padding: 20rpx 30rpx;
			bottom: 0;

			.device {
				height: 38rpx;
				line-height: 38rpx;
				font-size: 26rpx;
				color: #bbbbbb;
				margin-top: 22rpx;
			}

			.printing {
				button {
					height: 80rpx;
					width: 200rpx;
				}
			}
		}
	}
}
</style>
