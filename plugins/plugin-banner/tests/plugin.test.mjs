import chai from 'chai'
import { Design } from '@freesewing/core'
import { bannerPlugin } from '../src/index.mjs'

const expect = chai.expect

describe('Banner Plugin Tests', () => {
  it('Should add repeating text to a path', () => {
    const part = {
      name: 'test',
      draft: ({ Point, points, Path, paths, macro }) => {
        points.from = new Point(30, 30)
        points.to = new Point(30, 100)
        paths.example = new Path().move(points.from).line(points.to)

        macro('banner', {
          text: 'foo',
          path: 'example',
        })
      },
    }
    const design = new Design({ parts: [part], plugins: [bannerPlugin] })
    const pattern = new design()
    pattern.draft()
    const c = pattern.parts.test.paths.example
    expect(c.attributes.get('data-text')).to.equal(
      '&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;foo&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;foo&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;foo&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;foo&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;foo&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;foo&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;foo&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;foo&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;foo&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;foo&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;'
    )
    expect(c.attributes.get('data-text-class')).to.equal('center')
    expect(c.attributes.get('data-text-dy')).to.equal('-1')
  })

  it('Number of spaces should be configurable', () => {
    const part = {
      name: 'test',
      draft: ({ Point, points, Path, paths, macro }) => {
        points.from = new Point(30, 30)
        points.to = new Point(30, 100)
        paths.example2 = new Path().move(points.from).line(points.to)

        macro('banner', {
          text: 'foo',
          path: 'example2',
          spaces: 2,
          repeat: 2,
        })
      },
    }
    const design = new Design({ parts: [part], plugins: [bannerPlugin] })
    const pattern = new design()
    pattern.draft()
    const c = pattern.parts.test.paths.example2
    expect(c.attributes.get('data-text')).to.equal('&#160;&#160;foo&#160;&#160;foo&#160;&#160;')
  })

  it('Number of repetitions should be configurable', () => {
    const part = {
      name: 'test',
      draft: ({ Point, points, Path, paths, macro }) => {
        points.from = new Point(30, 30)
        points.to = new Point(30, 100)
        paths.example3 = new Path().move(points.from).line(points.to)

        macro('banner', {
          text: 'foo',
          path: 'example3',
          spaces: 1,
          repeat: 4,
        })
      },
    }
    const design = new Design({ parts: [part], plugins: [bannerPlugin] })
    const pattern = new design()
    pattern.draft()
    const c = pattern.parts.test.paths.example3
    expect(c.attributes.get('data-text')).to.equal('&#160;foo&#160;foo&#160;foo&#160;foo&#160;')
  })
})
