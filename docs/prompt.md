在system settings增加修改comfyui workflow配置,根据comfyui-workflow的z-image-turbo.json配置，按照输入正向提示词positive_prompt,反向提示词,negative_prompt,图片高宽(image_height,image_width).统一comfyui的文生图工作流使用，可以增加工作流的配置。向comfyui发出工作流图片生成提示词。在comfyui生图使用该配置进行生图。

解决不能将工作流发送到comfyui问题，将文生图模型改成z-image-turbo,krea2-turbo,qwen-image-2512,flux2,ideogram-v4,stable-diffusion-3。解决插入了占位符的JSON保存出错的问题。

