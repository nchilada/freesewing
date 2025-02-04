import chai from 'chai'
import { round, Pattern, Design, pctBasedOn } from '../src/index.mjs'

const expect = chai.expect

describe('Pattern', () => {
  describe('Pattern.sample()', () => {

    it('Should sample an option', () => {
      const part = {
        name: 'test',
        measurements: ['head'],
        options: {
          size: { pct: 50, min: 20, max: 80 },
        },
        draft: ({ Point, paths, Path, measurements, options, part }) => {
          paths.test = new Path()
            .move(new Point(0,0))
            .line(new Point(0, measurements.head * options.size))

          return part
        },
      }
      const Pattern = new Design({ parts: [part] })
      const pattern = new Pattern({
        measurements: { head: 400 },
        sample: {
          type: 'option',
          option: 'size'
        }
      })
      pattern.sample()
      expect(pattern.stores.length).to.equal(10)
      expect(pattern.settings.length).to.equal(10)
      expect(pattern.parts[9].test.paths.test.ops[1].to.y).to.equal(320)
    })

    it('Should sample a static option', () => {
      const part = {
        name: 'test',
        measurements: ['head'],
        options: {
          size: 0.05,
        },
        draft: ({ Point, paths, Path, measurements, options, part }) => {
          paths.test = new Path()
            .move(new Point(0,0))
            .line(new Point(0, measurements.head * options.size))

          return part
        },
      }
      const Pattern = new Design({ parts: [part] })
      const pattern = new Pattern({
        measurements: { head: 400 },
        sample: {
          type: 'option',
          option: 'size'
        }
      })
      pattern.sample()
      expect(pattern.stores.length).to.equal(10)
      expect(pattern.settings.length).to.equal(10)
      expect(round(pattern.parts[9].test.paths.test.ops[1].to.y)).to.equal(22)
    })

    it('Should sample a list option', () => {
      const part = {
        name: 'test',
        measurements: ['head'],
        options: {
          size: { dflt: 5, list: [1, 2, 3, 4, 5 ,6 ,7, 8, 9, 10] },
        },
        draft: ({ Point, paths, Path, measurements, options, part }) => {
          paths.test = new Path()
            .move(new Point(0,0))
            .line(new Point(0, measurements.head * options.size/10))

          return part
        },
      }
      const Pattern = new Design({ parts: [part] })
      const pattern = new Pattern({
        measurements: { head: 400 },
        sample: {
          type: 'option',
          option: 'size'
        }
      })
      pattern.sample()
      expect(pattern.stores.length).to.equal(10)
      expect(pattern.settings.length).to.equal(10)
      expect(pattern.parts[9].test.paths.test.ops[1].to.y).to.equal(400)
    })

    it('Should sample a measurement', () => {
      const part = {
        name: 'test',
        measurements: ['head'],
        options: {
          size: { pct: 50, min: 20, max: 80 },
        },
        draft: ({ Point, paths, Path, measurements, options, part }) => {
          paths.test = new Path()
            .move(new Point(0,0))
            .line(new Point(0, measurements.head * options.size))

          return part
        },
      }
      const Pattern = new Design({ parts: [part] })
      const pattern = new Pattern({
        measurements: { head: 400 },
        sample: {
          type: 'measurement',
          measurement: 'head'
        }
      })
      pattern.sample()
      expect(pattern.stores.length).to.equal(10)
      expect(pattern.settings.length).to.equal(10)
      expect(pattern.parts[9].test.paths.test.ops[1].to.y).to.equal(216)
    })

    it('Should log an error when sampling an undefined measurement', () => {
      const part = {
        name: 'test',
        measurements: ['head'],
        options: {
          size: { pct: 50, min: 20, max: 80 },
        },
        draft: ({ Point, paths, Path, measurements, options, part }) => {
          paths.test = new Path()
            .move(new Point(0,0))
            .line(new Point(0, measurements.head * options.size))

          return part
        },
      }
      const Pattern = new Design({ parts: [part] })
      const pattern = new Pattern({
        measurements: { },
        sample: {
          type: 'measurement',
          measurement: 'head'
        }
      })
      pattern.sample()
      expect(pattern.stores[0].logs.error.length).to.equal(1)
      expect(pattern.stores[0].logs.error[0]).to.equal("Cannot sample measurement `head` because it's `undefined`")
    })

    it('Should sample models', () => {
      const part = {
        name: 'test',
        measurements: ['head'],
        options: {
          size: { pct: 50, min: 20, max: 80 },
        },
        draft: ({ Point, paths, Path, measurements, options, part }) => {
          paths.test = new Path()
            .move(new Point(0,0))
            .line(new Point(0, measurements.head * options.size))

          return part
        },
      }
      const Pattern = new Design({ parts: [part] })
      const pattern = new Pattern({
        measurements: { head: 400 },
        sample: {
          type: 'models',
          models: {
            a: { head: 100 },
            b: { head: 200 },
            c: { head: 300 },
            d: { head: 400 },
          },
          focus: 'c'
        }
      })
      pattern.sample()
      expect(pattern.stores.length).to.equal(4)
      expect(pattern.settings.length).to.equal(4)
      expect(pattern.parts[3].test.paths.test.ops[1].to.y).to.equal(200)
    })

    /*
    it("Should sample a list option", () => {
      const front = {
        name: 'front',
        options: {
          len: {
            dflt: 1,
            list: [1,2,3]
          }
        },
        draft: function(part) {
          const { Point, points, Path, paths, options } = part.shorthand()
          points.from = new Point(0, 0);
          points.to = new Point( 100 * options.len, 0)
          paths.line = new Path()
            .move(points.from)
            .line(points.to)

          return part
        }
      }
      const Test = new freesewing.Design({
        name: "test",
        parts: [front],
      })
      const pattern = new Test({
        sample: {
          type: 'option',
          option: 'len'
        }
      })
      pattern.sample();
      console.log(pattern.parts)
      expect(pattern.parts.front.paths.line_1.ops[1].to.x).to.equal(100);
      expect(pattern.parts.front.paths.line_2.ops[1].to.x).to.equal(200);
      expect(pattern.parts.front.paths.line_3.ops[1].to.x).to.equal(300);
    });

    it("Should sample a measurement", () => {
      const Test = new freesewing.Design({
        name: "test",
        parts: ['front'],
        measurements: ['head']
      })
      Test.prototype.draftFront = function(part) {
        const { Point, points, Path, paths, measurements } = part.shorthand()
        points.from = new Point(0, 0);
        points.to = new Point( measurements.head, 0)
        paths.line = new Path()
          .move(points.from)
          .line(points.to)

        return part
      };
      const pattern = new Test({
        measurements: {
          head: 100
        },
        sample: {
          type: 'measurement',
          measurement: 'head'
        }
      })
      pattern.sample();
      expect(pattern.is).to.equal('sample')
      expect(pattern.events.debug[0]).to.equal('Sampling measurement `head`')
      for (let i=0;i<10;i++) {
        const j = i + 1
        expect(pattern.parts.front.paths[`line_${j}`].ops[1].to.x).to.equal(90 + 2*i);
      }
      pattern.sampleMeasurement('nope')
      expect(pattern.events.error.length).to.equal(1)
      expect(pattern.events.error[0]).to.equal("Cannot sample measurement `nope` because it's `undefined`")
    });

    it("Should sample models", () => {
      const Test = new freesewing.Design({
        name: "test",
        parts: ['front'],
        measurements: ['head']
      })
      Test.prototype.draftFront = function(part) {
        const { Point, points, Path, paths, measurements } = part.shorthand()
        points.from = new Point(0, 0);
        points.to = new Point( measurements.head, 0)
        paths.line = new Path()
          .move(points.from)
          .line(points.to)

        return part
      };
      let pattern = new Test({
        sample: {
          type: 'models',
          models : {
            a: { head: 100 },
            b: { head: 50 },
          }
        }
      })
      pattern.sample();
      expect(pattern.is).to.equal('sample')
      expect(pattern.events.debug[0]).to.equal('Sampling models')
      expect(pattern.parts.front.paths[`line_0`].ops[1].to.x).to.equal(100);
      expect(pattern.parts.front.paths[`line_1`].ops[1].to.x).to.equal(50);
      pattern = new Test({
        sample: {
          type: 'models',
          models : {
            a: { head: 100 },
            b: { head: 50 },
          },
          focus: 'b'
        }
      })
      pattern.sample();
      expect(pattern.is).to.equal('sample')
      expect(pattern.parts.front.paths[`line_-1`].ops[1].to.x).to.equal(50);
      expect(pattern.parts.front.paths[`line_0`].ops[1].to.x).to.equal(100);
    });


    it('Should return all render props', () => {
      const front = {
        name: 'front',
        draft: function (part) {
          return part
        },
      }
      const Test = new Design({
        name: 'test',
        parts: [front],
      })
      const pattern = new Test()
      pattern.draft()
      const rp = pattern.getRenderProps()
      expect(rp.svg.body).to.equal('')
      expect(rp.width).to.equal(4)
      expect(rp.height).to.equal(4)
      expect(rp.parts.front.height).to.equal(4)
    })

    it('Should not pack a pattern with errors', () => {
      const pattern = new Pattern()
      pattern.events.error.push('error')
      pattern.pack()
      expect(pattern.events.warning.length).to.equal(1)
      expect(pattern.events.warning[0]).to.equal(
        'One or more errors occured. Not packing pattern parts'
      )
    })

    it("Should generate an auto layout if there is no set layout", () => {
      const Test = new freesewing.Design({
        name: "test",
        parts: [
          {
            name: 'front',
            draft: function(part) {
              const {Path, paths, Point} = part.shorthand()
              paths.seam = new Path().move(new Point(0,0))
                .line(new Point(5,5))
              return part
            }
          }
        ]
      })
      const pattern = new Test()
      pattern.parts.front = new pattern.Part('front')
      pattern.draftFront(pattern.parts.front);
      pattern.pack()
      expect(pattern.autoLayout.parts.front).to.exist
      expect(pattern.autoLayout.parts.front.move.y).to.equal(2)
      expect(pattern.autoLayout.parts.front.move.x).to.equal(2)
    })

    it("Should handle custom layouts", () => {
      const Test = new Design({ name: "test", parts: ['front'] })
      Test.prototype.draftFront = function(part) { return part }
      const pattern = new Test({
        layout: {
          width: 400,
          height: 200,
          parts: { front: { move: { x: 14, y: -202 } } }
        }
      })
      pattern.pack()
      expect(pattern.width).to.equal(400)
      expect(pattern.height).to.equal(200)
    });

    it("Should handle a simple snapped option", () => {
      const Test = new Design({
        name: "test",
        parts: ['front'],
        measurements: [ 'head' ],
        options: {
          len: { pct: 50, min: 22, max: 78, snap: 10, ...pctBasedOn('head') }
        }
      })
      Test.prototype.draftFront = function(part) {
        const { Point, points, Path, paths, absoluteOptions } = part.shorthand()
        points.from = new Point(0, 0);
        points.to = new Point( 2 * absoluteOptions.len, 0)
        paths.line = new Path()
          .move(points.from)
          .line(points.to)

        return part
      };
      let pattern = new Test({
        sample: {
          type: 'option',
          option: 'len'
        },
        measurements: {
          head: 43.23
        }
      })
      pattern.sample();
      expect(pattern.is).to.equal('sample')
      expect(pattern.events.debug[0]).to.equal('Sampling option `len`')
      expect(pattern.parts.front.paths.line_1.ops[1].to.x).to.equal(20);
      expect(pattern.parts.front.paths.line_2.ops[1].to.x).to.equal(40);
      expect(pattern.parts.front.paths.line_3.ops[1].to.x).to.equal(40);
      expect(pattern.parts.front.paths.line_4.ops[1].to.x).to.equal(40);
      expect(pattern.parts.front.paths.line_5.ops[1].to.x).to.equal(60);
      expect(pattern.parts.front.paths.line_6.ops[1].to.x).to.equal(60);
      expect(pattern.parts.front.paths.line_7.ops[1].to.x).to.equal(60);
      expect(pattern.parts.front.paths.line_8.ops[1].to.x).to.equal(60);
      expect(pattern.parts.front.paths.line_9.ops[1].to.x).to.equal(80);
      expect(pattern.parts.front.paths.line_10.ops[1].to.x).to.equal(80);
    });

    it("Should handle a list snapped option", () => {
      const Test = new Design({
        name: "test",
        parts: [
          {
            name: 'front',
            draft: function(part) {
              const { Point, points, Path, paths, absoluteOptions } = part.shorthand()
              points.from = new Point(0, 0);
              points.to = new Point( absoluteOptions.len, 0)
              paths.line = new Path()
                .move(points.from)
                .line(points.to)

              return part
            }
          }
        ],
        measurements: [ 'head' ],
        options: {
          len: { pct: 50, min: 22, max: 78, snap: [10,14,19,28], ...pctBasedOn('head') }
        }
      })
      let pattern = new Test({
        sample: {
          type: 'option',
          option: 'len'
        },
        measurements: {
          head: 43.23
        }
      })
      pattern.sample();
      expect(pattern.is).to.equal('sample')
      expect(pattern.events.debug[0]).to.equal('Sampling option `len`')
      expect(pattern.parts.front.paths.line_1.ops[1].to.x).to.equal(10);
      expect(pattern.parts.front.paths.line_2.ops[1].to.x).to.equal(14);
      expect(pattern.parts.front.paths.line_3.ops[1].to.x).to.equal(14);
      expect(pattern.parts.front.paths.line_4.ops[1].to.x).to.equal(19);
      expect(pattern.parts.front.paths.line_5.ops[1].to.x).to.equal(19);
      expect(pattern.parts.front.paths.line_6.ops[1].to.x).to.equal(19);
      expect(pattern.parts.front.paths.line_7.ops[1].to.x).to.equal(28);
      expect(pattern.parts.front.paths.line_8.ops[1].to.x).to.equal(28);
      expect(pattern.parts.front.paths.line_9.ops[1].to.x).to.equal(28);
      expect(round(pattern.parts.front.paths.line_10.ops[1].to.x)).to.equal(33.72);
    });


    it("Should retrieve the cutList", () => {
      const Test = new Design({
        name: "test",
        parts: [{
          name: 'front',
          draft: function(part) {
            const { addCut } = part.shorthand()
            addCut(4, 'lining', true)
            return part
          }
        }],
      })
      const pattern = new Test()
      expect(JSON.stringify(pattern.getCutList())).to.equal(JSON.stringify({}))
      pattern.draft()
      const list = `{"front":{"grain":90,"materials":{"lining":{"cut":4,"identical":true}}}}`
      expect(JSON.stringify(pattern.getCutList())).to.equal(list)
    });
    */
  })
})
