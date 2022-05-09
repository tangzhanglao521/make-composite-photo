<template>
	<uni-nav-bar :fixed="true" :title="title" :border="false" :status-bar="true">
		<view slot="left">
			<view class="capsule">
				<view @tap="handleBackClick" class="capsule-item" >
					<image src="../../static/back.png"  alt="" mode="aspectFit">
				</view>
				<view class="line" v-if="isAndroid"></view>
				<view @tap="handleHomeClick" class="capsule-item capsule-item-2">
					<image src="../../static/home@2x.png"  alt="" mode="aspectFit">
				</view>
			</view>
		</view>
	</uni-nav-bar>
</template>

<script>
	import uniNavBar from '@/uni_modules/uni-nav-bar/components/uni-nav-bar/uni-nav-bar.vue'
	export default {
		data(){
			return {
				isAndroid: uni.getSystemInfoSync().platform !== 'android'
			}
		},
		components: {
			uniNavBar
		},
		props: ['title'],
		created() {
			let menuButtonInfo = uni.getMenuButtonBoundingClientRect()
		},
		methods: {
			handleBackClick() {
				uni.navigateBack()
			},
			handleHomeClick() {
				uni.reLaunch({
					url: '/pages/index/index'
				})
			}
		}

	}
</script>
<style lang="scss" scoped>
	.capsule {
		position: relative;
		display: flex;
		height: 32px;
		width: 87px;
		justify-content: space-around;
		align-items: center;
		box-sizing: border-box;
		padding: 0 5px;
		&::before {
		    content: '';
		    position: absolute;
			top:0;
			left:0;
			border-radius: 32px;
		    width: 200%;
		    height: 200%;
		    border: 1px solid #eee;
		    transform-origin: 0 0;
		    transform: scale(0.5, 0.5);  
		    box-sizing: border-box;
			pointer-events: none;
		 }
		.capsule-item{
			display: flex;
			justify-content: flex-start;
			align-items: center;
			image{
				width: 20px;
				height: 20px;
			}
			&.capsule-item-2{
				justify-content: flex-end;
			}
		}
		.line {
			width: 1px;
			height: 19px;
			background: #C9C9C9;
		}
		
	}
</style>
