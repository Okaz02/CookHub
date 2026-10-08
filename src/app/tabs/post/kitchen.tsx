import { SlicedImage } from '../../../components/SlicedImage';

export default function Kitchen() {
  return (
      <SlicedImage
        source={require('./tray.png')}
        cols={[
          { percent: 45, stretch: false },
          { percent: 10, stretch: true },
          { percent: 45, stretch: false },
        ]}
        rows={[
          { percent: 45, stretch: false },
          { percent: 10, stretch: true },
          { percent: 45, stretch: false },
        ]}
        scale={4}
        style={{ width: '100%', height: '100%', padding: 30 }}
      >
    </SlicedImage>
  );
}