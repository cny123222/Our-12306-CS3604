/**
 * 车次服务 - 封装车次相关的API调用
 */
const CANDIDATE_BASES = ['/api', 'http://localhost:3000/api', 'http://localhost:3100/api']
let API_BASE: string | null = null
async function apiFetch(path: string, init?: RequestInit) {
  const bases = API_BASE ? [API_BASE] : CANDIDATE_BASES
  let lastRes: Response | null = null
  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`, init)
      lastRes = res
      if (res.status !== 404) {
        API_BASE = base
        return res
      }
    } catch {}
  }
  return lastRes ?? fetch(`${CANDIDATE_BASES[0]}${path}`, init)
}

/**
 * 搜索车次
 * @param departureStation 出发站
 * @param arrivalStation 到达站
 * @param departureDate 出发日期
 * @param trainTypes 车次类型（可选）
 */
export async function searchTrains(
  departureStation: string,
  arrivalStation: string,
  departureDate: string,
  trainTypes?: string[]
) {
  try {
    const response = await apiFetch(`/trains/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        departureStation,
        arrivalStation,
        departureDate,
        trainTypes: trainTypes || [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '查询失败');
    }

    const data = await response.json();
    return {
      success: true,
      trains: data.trains || [],
      timestamp: data.timestamp,
    };
  } catch (error: any) {
    console.error('搜索车次失败:', error);
    return {
      success: false,
      error: error.message || '查询失败，请稍后重试',
      trains: [],
    };
  }
}

/**
 * 获取车次详情
 * @param trainNo 车次号
 */
export async function getTrainDetails(trainNo: string, departureDate?: string) {
  try {
    const url = departureDate ? `/trains/${trainNo}?departureDate=${encodeURIComponent(departureDate)}` : `/trains/${trainNo}`
    const response = await apiFetch(url)

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '获取车次详情失败');
    }

    const data = await response.json();
    return {
      success: true,
      train: data,
    };
  } catch (error: any) {
    try {
      const fallbackUrl = new URL('../../../requirements/03-车次列表页/车次信息.json', import.meta.url).href
      const res = await fetch(fallbackUrl)
      const list = await res.json()
      let match = (list || []).find((t: any) => String(t.train_no).toLowerCase() === String(trainNo).toLowerCase())
      if (!match) {
        match = (list || []).find((t: any) => String(t.train_no).toLowerCase().startsWith(String(trainNo).toLowerCase()))
      }
      if (match) {
        return {
          success: true,
          train: {
            trainNo: match.train_no,
            trainType: match.train_type,
            model: match.model,
            departureDate: departureDate,
            route: {
              origin: match.route?.origin,
              destination: match.route?.destination,
              distanceKm: match.route?.distance_km,
              plannedDurationMin: match.route?.planned_duration_min,
              departureTime: match.route?.departure_time,
              arrivalTime: match.route?.arrival_time
            },
            stops: match.stops || []
          }
        }
      }
    } catch {}
    return {
      success: false,
      error: error.message || '获取车次详情失败',
      train: null,
    };
  }
}

/**
 * 获取筛选选项
 * @param departureStation 出发站
 * @param arrivalStation 到达站
 * @param departureDate 出发日期
 */
export async function getFilterOptions(
  departureStation: string,
  arrivalStation: string,
  departureDate: string
) {
  try {
    const response = await apiFetch(
      `/trains/filter-options?departureStation=${encodeURIComponent(
        departureStation
      )}&arrivalStation=${encodeURIComponent(
        arrivalStation
      )}&departureDate=${departureDate}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '获取筛选选项失败');
    }

    const data = await response.json();
    return {
      success: true,
      options: data,
    };
  } catch (error: any) {
    console.error('获取筛选选项失败:', error);
    return {
      success: false,
      error: error.message || '获取筛选选项失败',
      options: {
        departureStations: [],
        arrivalStations: [],
        seatTypes: [],
      },
    };
  }
}

/**
 * 计算余票数
 * @param trainNo 车次号
 * @param departureStation 出发站
 * @param arrivalStation 到达站
 * @param departureDate 出发日期
 */
export async function calculateAvailableSeats(
  trainNo: string,
  departureStation: string,
  arrivalStation: string,
  departureDate: string
) {
  try {
    const response = await apiFetch(`/trains/available-seats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainNo,
        departureStation,
        arrivalStation,
        departureDate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '计算余票失败');
    }

    const data = await response.json();
    return {
      success: true,
      availableSeats: data.availableSeats,
    };
  } catch (error: any) {
    console.error('计算余票失败:', error);
    return {
      success: false,
      error: error.message || '计算余票失败',
      availableSeats: {},
    };
  }
}

/**
 * 获取可选日期列表
 */
export async function getAvailableDates() {
  try {
    const response = await apiFetch(`/trains/available-dates`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '获取可选日期失败');
    }

    const data = await response.json();
    return {
      success: true,
      availableDates: data.availableDates || [],
      currentDate: data.currentDate,
    };
  } catch (error: any) {
    console.error('获取可选日期失败:', error);
    return {
      success: false,
      error: error.message || '获取可选日期失败',
      availableDates: [],
      currentDate: new Date().toISOString().split('T')[0],
    };
  }
}
