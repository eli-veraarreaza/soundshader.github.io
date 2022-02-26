import * as log from '../log.js';
import * as vargs from '../url_args.js';

export class GpuFrameBuffer {
  constructor(webgl, {
    size,
    width,
    height,
    channels = 1,
    // This GPU framebuffer can be bound to a JS ArrayBuffer,
    // so every time this framebuffer is bound to a fragment
    // shader, the CPU data would be copied to GPU.
    source = null,
  }) {
    if (source && !(source instanceof Float32Array))
      throw new Error(`Texture can be bound only to a Float32Array`);

    if (size && (width || height))
      throw new Error(`Can't set size and width x height at the same time`);

    if (size) {
      width = size;
      height = size;
    }

    this.width = width;
    this.height = height;
    this.channels = channels;
    this.source = source;
    this.webgl = webgl;

    this.checkBufferSize();
    this.prepareFBO();
    this.clear();
  }

  destroy() {
    if (this.texture) {
      this.webgl.gl.deleteTexture(this.texture);
      this.webgl.checkError();
    }
  }

  // Moves data from GPU to CPU. Beware that doing this at 60 fps,
  // even if the texture is 1x1, kills the performance entirely.
  download(output = new Float32Array(this.width * this.height * this.channels),
    x = 0, y = 0, width = this.width, height = this.height) {

    if (output.length != width * height * this.channels)
      throw new Error('Invalid CPU buffer length: ' + output.length);

    let gl = this.webgl.gl;

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D, this.texture, 0);

    this.tempbuf = this.tempbuf ||
      new Float32Array(this.width * this.height * 4);

    gl.readPixels(x, y, width, height,
      gl.RGBA /* this.fmt.format */, this.type, this.tempbuf);

    // This is ugly. readPixels() should really work with gl.RG.
    for (let i = 0; i < width * height; i++)
      for (let j = 0; j < this.channels; j++)
        output[i * this.channels + j] = this.tempbuf[i * 4 + j];

    return output;
  }

  clear() {
    let gl = this.webgl.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    this.webgl.checkError();
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D, this.texture, 0);
    this.webgl.checkError();
    gl.viewport(0, 0, this.width, this.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  attach(id) {
    let gl = this.webgl.gl;
    gl.activeTexture(gl.TEXTURE0 + id);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    this.webgl.checkError();
    if (this.source)
      this.upload(this.source);
    return id;
  }

  upload(source) {
    let nw = this.width;
    let nh = this.height;
    let ch = this.channels;

    if (source.length != nw * nh * ch) {
      let temp = new Float32Array(nw * nh * ch);
      temp.set(source.subarray(0, temp.length));
      source = temp;
    }

    let gl = this.webgl.gl;
    let mipmap = 0;
    let border = 0;
    let offset = 0;
    let type = this.type;
    let fmt = this.fmt;
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      mipmap,
      fmt.internalFormat,
      nw,
      nh,
      border,
      fmt.format,
      type,
      source,
      offset);
    this.webgl.checkError();
  }

  checkBufferSize() {
    let gl = this.webgl.gl;

    let { width, height, channels } = this;

    let count = width * height * channels;
    let spec = `${width}x${height}x${channels}`;
    let note = `${spec} = ${count >> 20}M x float`;
    let tmax = gl.getParameter(gl.MAX_TEXTURE_SIZE);

    log.v(`GPU buffer: ${note}`);

    if (count > 2 ** vargs.FBO_MAX_SIZE || Math.max(width, height) > tmax)
      throw new Error(`Texture too large: ${note}`);
  }

  prepareFBO() {
    let { webgl, width, height, channels } = this;
    let gl = webgl.gl;
    let fmt = webgl.getTextureFormat(channels);

    gl.activeTexture(gl.TEXTURE0);

    this.fmt = fmt;
    this.type = webgl.ext.floatTexType;
    this.texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internalFormat, width, height, 0, fmt.format, this.type, null);
    this.webgl.checkError();

    this.fbo = gl.createFramebuffer();
  }
}

GpuFrameBuffer.DUMMY = 'dummy';
