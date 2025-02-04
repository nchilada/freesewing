import { addDartToCurve, dartCalc } from './utils.mjs'

export const measurements = ['waist', 'seat', 'waistToHips', 'waistToSeat', 'waistToKnee']
export const waistEase = { pct: 1, min: 0, max: 8, menu: 'fit' }
export const options = {
  // FIXME: All of these constants mean this pattern won't scale properly :(
  dartMaximumDifference: 300,
  dartMinimumDifference: 180,
  dartMinimumWidth: 6,
  dartSideMinimum: 10,
  dartBackControl1: 100,
  dartBackControl2: 5,
  dartBackControl3: 4,
  curvePlacement: 2.4,
  dart2offset: 32,
  dart2factor: 0.8,
  hipCurveDividerDown: 40,
  hipCurveDividerUp: 3,
  sideSeamShiftPercentage: 0.006,
  backVentWidth: 0.1,
  paperlessOffset: 15,
  lengthBonus: { pct: 0, min: -50, max: 50, menu: 'style' },
  hemBonus: { pct: 0, min: -35, max: 0, menu: 'style' },
  hem: { pct: 2, min: 0, max: 5, menu: 'style' },
  backVent: { bool: true, menu: 'style' },
  backVentLength: { pct: 40, min: 5, max: 70, menu: 'style' },
  zipperLocation: { dflt: 'backSeam', list: ['backSeam', 'sideSeam'], menu: 'style' },
  nrOfDarts: { count: 2, min: 1, max: 2, menu: 'style' },
  seatEase: { pct: 1, min: 0, max: 8, menu: 'fit' },
  waistEase,
  backDartDepthFactor: { pct: 50, min: 35, max: 70, menu: 'advanced' },
  frontDartDepthFactor: { pct: 45, min: 30, max: 65, menu: 'advanced' },
  dartToSideSeamFactor: { pct: 50, min: 30, max: 70, menu: 'advanced' },
}

export function BuildMainShape(
  { sa, options, measurements, Point, Path, points, paths, store, paperless, macro, part },
  frontPart
) {
  let skirtLength = measurements.waistToKnee * (1 + options.lengthBonus) // + options.hem;

  store.set('skirtLength', skirtLength)
  store.set('waistEase', measurements.waist * options.waistEase)
  store.set('seatEase', measurements.seat * options.seatEase)
  // [joost] I don't like how hem is handled here rather than as hem allowance
  store.set('hem', measurements.waistToKnee * options.hem)

  let dartDepthFactor = frontPart ? options.frontDartDepthFactor : options.backDartDepthFactor

  let waist = measurements.waist
  let seat = measurements.seat > waist ? measurements.seat : waist

  dartCalc(store, options, seat, store.get('seatEase'), waist, store.get('waistEase'))

  let nrOfDarts = store.get('nrOfDarts')
  let dartSize = store.get('frontDartSize')
  if (frontPart == false) {
    dartSize = store.get('backDartSize')
  }

  if (dartSize <= 0) {
    nrOfDarts = 0
  }

  store.set('nrOfDarts', nrOfDarts)
  store.set('dartSize', dartSize)

  let sideSeamShift = (frontPart ? -1 : 1) * options.sideSeamShiftPercentage * seat

  seat += store.get('seatEase')
  waist += store.get('waistEase')

  let sideSeam = seat / 4 + sideSeamShift

  points.lWaist = new Point(0, 0)
  points.lLeg = new Point(0, skirtLength)
  points.rWaistOriginal = new Point(sideSeam, 0)
  points.rLeg = new Point(sideSeam + (options.hemBonus * seat) / 10, skirtLength)

  points.lSeat = new Point(0, measurements.waistToSeat)
  points.rSeat = new Point(sideSeam, measurements.waistToSeat)
  points.rWaistCPdown = new Point(sideSeam, measurements.waistToSeat / 3)
  points.rSeatCPup = new Point(sideSeam, (measurements.waistToSeat / 3) * 2)
  points.rSeatCPdown = points.rSeat.shift(
    270,
    ((measurements.waistToSeat - measurements.waistToHips) *
      Math.abs((options.hemBonus * seat) / 10)) /
      options.hipCurveDividerDown
  )
  //$p->newPoint('pH',   $sideSeam, $model->m('waistToHips') -$this->o('waistSideSeamRise'));
  let waistFactor = 0.99
  let sideFactor = 0.97
  let wdelta = 1
  let sdelta = 1
  let iteration = 0
  let waistCurve = null
  let waistPath = null
  let waistPathSA = null
  let waistLength = 0
  let sideSeamPath = null
  let sideSeamLength = 0
  let curve1 = null
  let curve2 = null

  do {
    if (wdelta < -1) {
      waistFactor *= 0.99
    } else if (wdelta > 1) {
      waistFactor *= 1.02
    }
    if (sdelta < -1) {
      sideFactor *= 0.98
    } else if (sdelta > 1) {
      sideFactor *= 1.03
    }
    points.rWaistTemp1 = points.lWaist.shift(0, (waist / 4) * waistFactor)
    points.rWaistTemp2 = points.rWaistTemp1.shift(0, dartSize * nrOfDarts)
    points.rWaist = points.rWaistTemp2.shift(90, 16 * sideFactor)
    points.lWaistCP = points.lWaist.shift(0, seat / 12)
    points.rWaistCPleft = points.rWaist.shift(
      points.rWaist.angle(points.rWaistCPdown) - 90,
      waist / 16
    )

    waistCurve = new Path()
      .move(points.lWaist)
      .curve(points.lWaistCP, points.rWaistCPleft, points.rWaist)
      .hide()

    if (nrOfDarts > 0) {
      curve1 = addDartToCurve(
        part,
        waistCurve,
        seat / 4 / options.curvePlacement,
        dartSize,
        measurements.waistToSeat * dartDepthFactor
      )
      waistLength = curve1.left.length()
      points.dart1Start = curve1.dart.start()
      points.dart1Middle = curve1.dart.ops[1].to
      points.dart1End = curve1.dart.end()
      if (nrOfDarts > 1) {
        curve2 = addDartToCurve(
          part,
          curve1.right,
          options.dart2offset,
          dartSize,
          measurements.waistToSeat * dartDepthFactor * options.dart2factor
        )
        waistLength += curve2.left.length()
        waistLength += curve2.right.length()
        waistPath = curve1.left.join(
          curve1.dart.join(curve2.left.join(curve2.dart.join(curve2.right)))
        )
        waistPathSA = curve1.left.join(curve2.left.join(curve2.right))
        points.dart2Start = curve2.dart.start()
        points.dart2Middle = curve2.dart.ops[1].to
        points.dart2End = curve2.dart.end()
      } else {
        waistLength += curve1.right.length()
        waistPath = curve1.left.join(curve1.dart.join(curve1.right))
        waistPathSA = curve1.left.join(curve1.right)
      }
    } else {
      waistLength = waistCurve.length()
      waistPath = waistCurve
      waistPathSA = waistCurve.clone()
    }

    sideSeamPath = new Path()
      .move(points.rLeg)
      .curve(points.rLeg, points.rSeatCPdown, points.rSeat)
      .curve(points.rSeatCPup, points.rWaistCPdown, points.rWaist)

    wdelta = waist / 4 - waistLength

    if (frontPart) sdelta = 0
    else {
      sideSeamLength = sideSeamPath.length()
      sdelta = store.get('sideSeamLength') - sideSeamLength
    }
  } while ((Math.abs(wdelta) > 1 || Math.abs(sdelta) > 1) && iteration++ < 100)

  paths.waist1 = waistCurve.translate(0, 10).attr('class', 'lining dashed')

  if (iteration >= 100) {
    throw 'Too many iterations trying to make it fit!'
  }

  if (frontPart) {
    sideSeamLength = sideSeamPath.length()
    store.set('sideSeamLength', sideSeamLength)
  }

  points.lHem = points.lLeg
  points.rHem = points.rLeg

  paths.hem = new Path()
    .move(points.lLeg)
    .line(points.rLeg)
    .attr('class', 'fabric stroke-sm')
    .hide()

  if (store.get('hem') > 0) {
    // Create the inverse of the curve from the leg to the waist
    // Then split it at the hem level
    points.lHem = points.lLeg.shift(270, store.get('hem'))
    let rInverseSeat = points.rSeat.shift(270, (points.rLeg.y - points.rSeat.y) * 2)
    let rInverseSeatCP = rInverseSeat.shift(90, points.rSeatCPdown.y - points.rSeat.y)
    let rInversePath = new Path().move(rInverseSeat).curve(rInverseSeatCP, points.rLeg, points.rLeg)
    points.rHem = rInversePath.intersectsY(points.lHem.y)[0]

    let sideSeamHemPath = rInversePath.split(points.rHem)[1]

    sideSeamPath = sideSeamHemPath.join(sideSeamPath)

    paths.hem.unhide()
  }

  paths.leftSide = new Path().move(points.lWaist).line(points.lHem).hide()

  paths.bottom = new Path().move(points.lHem).line(points.rHem).hide()

  paths.sideSeam = sideSeamPath.hide()

  // Turn the path in the other direction, to comply with the counter-clockwise guideline
  paths.waist = waistPath.reverse().hide()
  paths.waistSA = waistPathSA.reverse().hide()

  points.titleAnchor = new Point(measurements.waist / 6, measurements.waistToSeat)
  points.logoAnchor = points.titleAnchor.shift(270, 75)

  points.grainlineTop = points.lWaist.shift(0, 50).shift(270, 50)
  points.grainlineBottom = points.lLeg.shift(0, 50).shift(90, 50)

  if (paperless) {
    macro('hd', {
      from: points.lSeat,
      to: points.rSeat,
      y: points.rSeat.y,
    })
    macro('vd', {
      from: points.lWaist,
      to: points.rWaist,
      x: points.rWaist.x + options.paperlessOffset + sa,
    })
    macro('vd', {
      from: points.lWaist,
      to: points.lLeg,
      x: points.lLeg.x + options.paperlessOffset + sa,
    })
    if (store.get('hem') > 0) {
      macro('vd', {
        from: points.lLeg,
        to: points.lHem,
        x: points.lLeg.x + options.paperlessOffset + sa,
      })
    }

    if (store.get('nrOfDarts') > 0) {
      macro('hd', {
        from: points.lWaist,
        to: points.dart1Middle,
        y: points.dart1Middle.y,
      })
      macro('hd', {
        from: points.lWaist,
        to: points.dart1Start,
        y: points.dart1Start.y - options.paperlessOffset - sa,
      })
      macro('hd', {
        from: points.dart1Start,
        to: points.dart1End,
        y: points.dart1End.y - options.paperlessOffset - sa,
      })
      if (store.get('nrOfDarts') > 1) {
        macro('hd', {
          from: points.lWaist,
          to: points.dart2Middle,
          y: points.dart2Middle.y,
        })
        macro('hd', {
          from: points.dart1End,
          to: points.dart2Start,
          y: points.dart2Start.y - options.paperlessOffset - sa,
        })
        macro('hd', {
          from: points.dart2Start,
          to: points.dart2End,
          y: points.dart2End.y - options.paperlessOffset - sa,
        })
        macro('hd', {
          from: points.dart2End,
          to: points.rWaist,
          y: points.rWaist.y - options.paperlessOffset - sa,
        })
        macro('vd', {
          from: points.lWaist,
          to: points.dart2Middle,
          x: points.lWaist.x - options.paperlessOffset - sa,
        })
        macro('vd', {
          from: points.dart2Middle,
          to: points.dart1Middle,
          x: points.lWaist.x - options.paperlessOffset - sa,
        })
        macro('vd', {
          from: points.dart1Middle,
          to: points.lSeat,
          x: points.lWaist.x - options.paperlessOffset - sa,
        })
      } else {
        macro('vd', {
          from: points.lWaist,
          to: points.dart1Middle,
          x: points.lWaist.x - options.paperlessOffset - sa,
        })
        macro('hd', {
          from: points.dart1End,
          to: points.rWaist,
          y: points.rWaist.y - options.paperlessOffset - sa,
        })
        macro('vd', {
          from: points.dart1Middle,
          to: points.lSeat,
          x: points.lWaist.x - options.paperlessOffset - sa,
        })
      }
    } else {
      macro('hd', {
        from: points.lWaist,
        to: points.rWaist,
        y: points.rWaist.y - options.paperlessOffset - sa,
      })
      macro('vd', {
        from: points.lWaist,
        to: points.lSeat,
        x: points.lWaist.x - options.paperlessOffset - sa,
      })
    }
  }
}
