import { Image, type ImageRequireSource } from 'react-native';

// require した画像の大きさ（px）。Metro が画像サイズを入れている。
// Web では require が { uri, width, height } を返し、Image.resolveAssetSource も無い
export function getImageSize(source: ImageRequireSource) {
  const webAsset = source as unknown as { width?: number; height?: number };
  const asset = typeof source === 'number' ? Image.resolveAssetSource(source)! : webAsset;
  return { width: asset.width!, height: asset.height! };
}
