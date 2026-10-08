import { SlicedImage } from '../../../components/SlicedImage';
import { BurnerLayout } from '../../../components/BurnerLayout';
import { View, Image } from 'react-native';

export default function Kitchen() {
  return (
      <SlicedImage
        source={require('./konro.png')}
        cols={[
          { percent: 18.05, stretch: false },
          { percent: 63.9, stretch: true },
          { percent: 18.05, stretch: false },
        ]}
        rows={[
          { percent: 5.3, stretch: false },
          { percent: 89.4, stretch: true },
          { percent: 5.3, stretch: false },
        ]}
        scale={4}
        style={{ width: '100%', height: '100%', padding: 30 }}
      >
      <BurnerLayout style={{ flex: 1 }}>
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
        <Image source={require('./fire.png')} style={{ width: 250, height: 200 }} />
      </BurnerLayout>
    </SlicedImage>
  );
}