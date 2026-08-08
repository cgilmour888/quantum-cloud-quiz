import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';

import {StormLayer} from '../../StormLayer';
import {ThreeCloudSystem} from '../ThreeCloudSystem';

describe('QCQ MASTER-guided three-cloud visual integration',()=>{
  it('renders exactly the primary rear-left and rear-right cloud bodies',()=>{
    const markup=renderToStaticMarkup(
      <ThreeCloudSystem active quality="cinematic" intensity={1}/>,
    );
    expect(
      (markup.match(/class="qcq-three-cloud-system__cloud"/g)??[]).length,
    ).toBe(3);
    expect(markup).toContain('data-cloud="primary"');
    expect(markup).toContain('data-cloud="rear-left"');
    expect(markup).toContain('data-cloud="rear-right"');
    expect(markup).toContain('data-cloud-count="3"');
  });

  it('renders StormLayer as the three-cloud authority rather than a raster dashboard',()=>{
    const markup=renderToStaticMarkup(
      <StormLayer
        active
        quality="balanced"
        motion="static"
        lightning={false}
        particles={false}
      />,
    );
    expect(markup).toContain('data-cloud-system="three-cloud"');
    expect(markup).toContain('data-cloud="primary"');
    expect(markup).not.toContain('neon-storm-cloud-exam-dashboard');
    expect(markup).not.toContain('<img');
  });

  it('activates native rain markup for a score-reactive finale without using artwork overlays',()=>{
    const markup=renderToStaticMarkup(
      <StormLayer
        active
        quality="balanced"
        motion="static"
        lightning={false}
        particles={false}
        finale={{
          quizId:'quiz-final',
          scorePercent:96,
          completedAt:1000,
        }}
      />,
    );
    expect(markup).toContain('data-finale-active="true"');
    expect(markup).toContain('qcq-rain-layer');
    expect(markup).not.toContain('background-image');
  });
});
