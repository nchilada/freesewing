import init from './init'

export default function (part) {
  let {
    store,
    sa,
    Point,
    points,
    Path,
    paths,
    Snippet,
    snippets,
    complete,
    paperless,
    macro,
    utils
  } = part.shorthand()

  // Initialize
  init(part)

  // Center back
  points.zero = new Point(0, 0)
  points.center = points.zero.shift(90, store.get('rise'))

  // Side top
  points.sideRight = new Point(store.get('hipsBack') / 2, points.center.y)

  // Gusset
  points.gussetTop = points.center.shift(-90, store.get('riseLength'))
  points.gussetBottom = points.gussetTop.shift(-90, store.get('gusset') + store.get('legBonus'))
  points.gussetRight = points.gussetBottom.shift(0, (store.get('gusset') * store.get('xScale')) / 2)
  points.gussetCpRight = new Point(points.gussetRight.x, points.gussetTop.y)

  // Find leg edge
  let isect = utils.circlesIntersect(
    points.gussetRight,
    store.get('legBack'),
    points.sideRight,
    store.get('fullLength')
  )
  points.legRight = isect[1]
  points.legLeft = points.legRight.flipX(points.center)

  // Store back seam length and (half of the) crotch seam length
  store.set('backSeamLength', points.sideRight.dist(points.legRight))
  store.set(
    'crotchSeamLength',
    new Path()
      .move(points.gussetTop)
      .curve(points.gussetCpRight, points.gussetRight, points.gussetRight)
      .length()
  )

  // Handle back rise
  points.center = points.center.shift(90, store.get('backRise'))
  points.sideRight = points.sideRight.shift(90, store.get('sideRise'))
  points.centerCpRight = new Point(points.sideRight.x / 2, points.center.y)
  points.centerCpLeft = points.centerCpRight.flipX()

  paths.seam = new Path()
    .move(points.gussetTop)
    .curve(points.gussetCpRight, points.gussetRight, points.gussetRight)
    .line(points.legRight)
    .line(points.sideRight)
    .curve(points.sideRight, points.centerCpRight, points.center)
    .line(points.gussetTop)
    .close()
    .attr('class', 'fabric')

  // Complete pattern?
  if (complete) {
    if (sa) {
      let sa1 = new Path()
        .move(points.legRight)
        .line(points.sideRight)
        .curve(points.sideRight, points.centerCpRight, points.center)
        .offset(sa)
      let sa2 = new Path()
        .move(points.gussetTop)
        .curve(points.gussetCpRight, points.gussetRight, points.gussetRight)
        .offset(sa)
      let hemSa = new Path()
        .move(points.gussetRight)
        .line(points.legRight)
        .offset(sa * 2)
      paths.sa = new Path()
        .move(points.gussetTop)
        .line(sa2.start())
        .join(sa2)
        .join(hemSa)
        .join(sa1)
        .line(points.center)
        .attr('class', 'fabric sa')
    }
    points.title = new Point(points.sideRight.x * 0.6, points.gussetTop.y * 0.6)
    macro('title', {
      at: points.title,
      nr: 1,
      title: 'back'
    })
    macro('cutonfold', {
      from: points.center,
      to: points.gussetTop,
      grainline: true
    })
    snippets.logo = new Snippet('logo', points.title.shift(90, 50))
  }

  // Paperless?
  if (paperless) {
    macro('vd', {
      from: points.gussetTop,
      to: points.center,
      x: points.center.x - 15
    })
    macro('vd', {
      from: points.gussetRight,
      to: points.center,
      x: points.center.x - 30
    })
    macro('vd', {
      from: points.legRight,
      to: points.sideRight,
      x: points.legRight.x + 15 + sa
    })
    macro('vd', {
      from: points.legRight,
      to: points.center,
      x: points.legRight.x + 30 + sa
    })
    macro('hd', {
      from: points.center,
      to: points.sideRight,
      y: points.center.y - 15 - sa
    })
    macro('hd', {
      from: points.gussetTop,
      to: points.gussetRight,
      y: points.gussetRight.y + 15 + sa * 2
    })
    macro('hd', {
      from: points.gussetTop,
      to: points.legRight,
      y: points.gussetRight.y + 30 + sa * 2
    })
    macro('ld', {
      from: points.gussetRight,
      to: points.legRight,
      d: -15 - sa * 2
    })
  }

  return part
}
