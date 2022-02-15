let args = new URLSearchParams(location.search);

console.groupCollapsed('Config:');

export const DEBUG = numarg('dbg', 0);
export const FFT_SIZE = numarg('n', 4096); // 2048 is the max on Android
export const SHADER = strarg('s', 'acf');
export const SHADER_FPS = numarg('fps', 60);
export const A4_FREQ = numarg('a4', 432);
export const SAMPLE_RATE = strarg('sr', 'A11', /^A?\d+$/,
  s => +s || 2 ** (s.slice(1) - 4) * A4_FREQ);
export const PLAYBACK_RATE = numarg('pbr', 1.0);
export const IMAGE_SIZE = numarg('img', 2048);
export const USE_MOUSE = numarg('mouse', 1);
export const HANN_WINDOW = numarg('hann', 1);
export const VOL_FACTOR = numarg('vol', 1);
export const SHOW_MIC = numarg('mic', 0);
export const NUM_STRIPES = numarg('ns', 1);

export const ACF_COLOR_SCHEME = numarg('acf.cs', 1);
export const ACF_SMODE = strarg('acf.smode');
export const ACF_LOUDNESS_RANGE = strarg('acf.lr', 2.5);
export const ACF_AGRAD = numarg('acf.agrad', 0);
export const ACF_TGRAD = numarg('acf.tgrad', 0);
export const ACF_R0 = numarg('acf.r0', 0.0);
export const ACF_POLAR = numarg('acf.polar', 0);
export const ACF_EXP = numarg('acf.exp', 1.5);
export const ACF_ABS_MAX = numarg('acf.absmax', 1.0);
export const ACF_STATS = numarg('acf.stats', 0);
export const ACF_ZOOM = numarg('acf.zoom', 5.0);
export const ACF_MAX_SIZE = numarg('acf.max', 4096);
export const ACF_COORDS = numarg('acf.coords', 0);
export const ACF_SIGMA = numarg('acf.sig', 3.0);
export const ACF_DECAY = numarg('acf.decay', 3.0);
export const ACF_A_WEIGHT = numarg('acf.aweight', 0.0);
export const ACF_RGB_1 = strarg('acf.c1', '4,2,1');
export const ACF_RGB_2 = strarg('acf.c2', '1,2,4');
export const ACF_RGB = numarg('acf.rgb', 1);
export const ACF_DYN_LOUDNESS = numarg('acf.dyn', 1);
export const ACF_LOUDNESS_DECAY = numarg('acf.dec', 0.999);
export const ACF_MUTE_RANGE = numarg('acf.mr', 1);

export const REC_FRAMERATE = numarg('rec.fps', 0);
export const CWT_BRIGHTNESS = numarg('cwt.b', 1);
export const CWT_LEN = numarg('cwt.len', 17);
export const CWT_N = numarg('cwt.3s', 30);
export const CWT_GL = numarg('cwt.gl', 1);
export const FFT_GL = numarg('fft.gl', 0);
export const FFT_TIME = numarg('fft.time', 0);
export const FFT_LOG_SCALE = numarg('fft.log', 1);
export const USE_ALPHA_CHANNEL = numarg('alpha', 0);
export const FBO_MAX_SIZE = numarg('fbo.max', 27);
export const SHOW_LOGS = numarg('log', 0);
export const FLOAT_PRECISION = strarg('fp', 'highp');
export const INT_PRECISION = strarg('ip', 'highp');

console.groupEnd();

function strarg(name, defval = '', regex = null, parser_fn = null) {
  let value = args.get(name);
  if (value === null)
    value = defval;
  let info = '?' + name + '=' + value;
  console.log(info);
  if (regex && !regex.test(value))
    throw new Error(info + ' doesnt match ' + regex);
  if (parser_fn)
    value = parser_fn(value);
  return value;
}

function numarg(name, defval = 0) {
  return +strarg(name, defval + '', /^\d+(\.\d+)?$/);
}
