// 全局变量
let uploadedImage = null;
let canvas = document.getElementById('previewCanvas');
let ctx = canvas.getContext('2d');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    // 初始绘制预览
    drawPreview();
});

// 初始化事件监听器
function initializeEventListeners() {
    // 图片上传
    const imageUpload = document.getElementById('imageUpload');
    imageUpload.addEventListener('change', handleImageUpload);

    // 颜色选择器同步
    const fontColor = document.getElementById('fontColor');
    const fontColorText = document.getElementById('fontColorText');
    fontColor.addEventListener('input', () => fontColorText.value = fontColor.value);
    fontColorText.addEventListener('input', () => fontColor.value = fontColorText.value);

    const outlineColor = document.getElementById('outlineColor');
    const outlineColorText = document.getElementById('outlineColorText');
    outlineColor.addEventListener('input', () => outlineColorText.value = outlineColor.value);
    outlineColorText.addEventListener('input', () => outlineColor.value = outlineColorText.value);

    // 字幕设置变化时重新绘制预览
    const settingInputs = document.querySelectorAll('#subtitleHeight, #fontSize, #fontColor, #outlineColor, #fontFamily, #fontWeight');
    settingInputs.forEach(input => {
        input.addEventListener('input', drawPreview);
    });

    // 字幕内容变化时重新绘制预览
    const subtitleContent = document.getElementById('subtitleContent');
    subtitleContent.addEventListener('input', drawPreview);

    // 保存按钮
    document.getElementById('saveBtn').addEventListener('click', saveImage);
}

// 处理图片上传
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 更新文件名显示
    document.getElementById('uploadedFileName').textContent = file.name;

    // 读取图片
    const reader = new FileReader();
    reader.onload = function(event) {
        uploadedImage = new Image();
        uploadedImage.onload = function() {
            drawPreview();
        };
        uploadedImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 绘制预览
function drawPreview() {
    if (!canvas) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 获取字幕内容行数
    const content = document.getElementById('subtitleContent').value;
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const subtitleHeight = parseInt(document.getElementById('subtitleHeight').value);
    const totalSubtitleHeight = lines.length * subtitleHeight;

    // 如果有上传的图片，绘制图片
    if (uploadedImage) {
        // 设置画布大小：原图大小 + 字幕区域高度
        canvas.width = uploadedImage.width;
        canvas.height = uploadedImage.height + totalSubtitleHeight;
        
        // 绘制原图
        ctx.drawImage(uploadedImage, 0, 0);
    } else {
        // 没有图片时，使用默认画布大小
        canvas.width = 800;
        canvas.height = 600 + totalSubtitleHeight;
        
        // 绘制默认背景
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制提示文字
        ctx.fillStyle = '#999';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('请上传图片', canvas.width / 2, canvas.height / 2);
    }

    // 绘制字幕
    drawSubtitle();
}

// 绘制字幕（切割感设计：从原图底部截取作为背景）
function drawSubtitle() {
    const content = document.getElementById('subtitleContent').value;
    if (!content.trim()) return;

    // 获取设置参数
    const subtitleHeight = parseInt(document.getElementById('subtitleHeight').value);
    const fontSize = parseInt(document.getElementById('fontSize').value);
    const fontColor = document.getElementById('fontColor').value;
    const outlineColor = document.getElementById('outlineColor').value;
    const fontFamily = document.getElementById('fontFamily').value;
    const fontWeight = document.getElementById('fontWeight').value;

    // 分割文本为行
    const lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    // 计算字幕位置（从原图底部开始）
    const originalHeight = uploadedImage ? uploadedImage.height : 600;
    const startY = originalHeight;
    const lineHeight = subtitleHeight;

    // 设置字体 - 确保字体粗细值有效
    const validFontWeights = ['normal', 'bold', 'lighter', 'bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
    const finalFontWeight = validFontWeights.includes(fontWeight) ? fontWeight : 'normal';
    ctx.font = `${finalFontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // 绘制每行字幕
    lines.forEach((line, index) => {
        // 计算行的位置
        const y = startY + index * lineHeight;
        const x = canvas.width / 2;
        const paddingY = (lineHeight - fontSize) / 2;

        // 绘制背景（从原图最底部截取，所有行使用同一区域）
        if (uploadedImage) {
            // 计算需要截取的原图区域：始终使用原图最底部的区域
            const sourceY = uploadedImage.height - subtitleHeight;
            const sourceHeight = subtitleHeight;
            
            // 从原图最底部截取区域作为字幕背景
            ctx.drawImage(
                uploadedImage, 
                0, sourceY, uploadedImage.width, sourceHeight, // 原图区域：始终使用最底部
                0, y, canvas.width, lineHeight // 目标区域（放大到字幕行高度）
            );
            
            // 添加半透明遮罩增强文字可读性
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, y, canvas.width, lineHeight);
        } else {
            // 没有图片时使用默认背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, y, canvas.width, lineHeight);
        }

        // 绘制文字轮廓
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 2;
        ctx.strokeText(line, x, y + paddingY);

        // 绘制文字内容
        ctx.fillStyle = fontColor;
        ctx.fillText(line, x, y + paddingY);
    });
}

// 保存图片
function saveImage() {
    if (!uploadedImage) {
        alert('请先上传图片');
        return;
    }

    // 创建下载链接
    const link = document.createElement('a');
    link.download = 'subtitle-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// 工具函数：获取文本宽度
function getTextWidth(text, font) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
}

// 工具函数：获取文本高度
function getTextHeight(font) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    const metrics = ctx.measureText('M');
    return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
}