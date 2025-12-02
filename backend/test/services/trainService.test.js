const trainService = require('../../src/services/trainService')

describe('trainService.getTrainDetails', () => {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()

  test('有效车次和日期返回详细信息', async () => {
    const details = await trainService.getTrainDetails('G103', today)
    expect(details).not.toBeNull()
    expect(details.trainNo).toBe('G103')
    expect(details.departureDate).toBe(today)
    expect(details).toHaveProperty('route')
    expect(details).toHaveProperty('stops')
    expect(details).toHaveProperty('cars')
    expect(details).toHaveProperty('fares')
    expect(details).toHaveProperty('availableSeats')
    expect(Array.isArray(details.stops)).toBe(true)
    expect(details.stops.length).toBeGreaterThan(0)
    expect(Array.isArray(details.cars)).toBe(true)
    expect(details.cars.length).toBe(8)
    expect(Array.isArray(details.fares)).toBe(true)
    expect(details.fares.length).toBe(8)
    const seats = details.availableSeats
    expect(seats['商务座']).toBe(10)
    expect(seats['一等座']).toBe(40)
    expect(seats['二等座']).toBe(80)
  })

  test('无效车次返回null', async () => {
    const details = await trainService.getTrainDetails('INVALID999', today)
    expect(details).toBeNull()
  })

  test('不同日期返回对应详情', async () => {
    const detailsTomorrow = await trainService.getTrainDetails('G103', tomorrow)
    expect(detailsTomorrow).not.toBeNull()
    expect(detailsTomorrow.departureDate).toBe(tomorrow)
    const seatsTomorrow = detailsTomorrow.availableSeats
    expect(seatsTomorrow['商务座']).toBe(10)
    expect(seatsTomorrow['一等座']).toBe(40)
    expect(seatsTomorrow['二等座']).toBe(80)
  })
})

describe('trainService.calculateAvailableSeats', () => {
  const today = new Date().toISOString().split('T')[0]

  test('跨区间返回全程空闲座位数', async () => {
    const result = await trainService.calculateAvailableSeats('G103', '北京南', '上海虹桥', today)
    expect(result['商务座']).toBe(10)
    expect(result['一等座']).toBe(40)
    expect(result['二等座']).toBe(80)
  })

  test('相邻两站返回该区间可用座位数', async () => {
    const result = await trainService.calculateAvailableSeats('G103', '北京南', '沧州西', today)
    expect(result['商务座']).toBe(10)
    expect(result['一等座']).toBe(40)
    expect(result['二等座']).toBe(80)
  })
})

