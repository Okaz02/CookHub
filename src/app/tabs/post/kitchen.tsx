import { SlicedImage } from '../../../components/SlicedImage';
<SlicedImage
  source={require('./cutting_board.jpg')}
  cols={[
    { percent: 7.8, stretch: false },
    { percent: 15.66, stretch: true },
    { percent: 53.38, stretch: false },
    { percent: 15.36, stretch: true },
    { percent: 7.8, stretch: false },
  ]}
  rows={[
    { percent: 5.53, stretch: false },
    { percent: 81.58, stretch: true },
    { percent: 12.89, stretch: false },
  ]}
  width={360}
  height={500}
  scale={4}
/>