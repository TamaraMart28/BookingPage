export interface IOrder {
    id: string,
    // Статус заказа или банкет
    // Возможные значения: New, Bill, Closed, Banquet
    status: OrderStatusKey,
    start_time: string,
    end_time: string,
}
export enum OrderStatus {
    New = 'Новый',
    Bill = 'Пречек',
    Closed = 'Закрытый',
    Banquet = 'Банкет'
}
export type OrderStatusKey = keyof typeof OrderStatus

export interface IReservation {
    id: number,
    name_for_reservation: string,
    num_people: number,
    phone_number: string,
    // Возможные значения: Живая очередь, Новая, Заявка, Открыт, Закрыт
    status: ReservationStatus,
    seating_time: string,
    end_time: string,
}
export enum ReservationStatus {
    Queue = 'Живая очередь',
    New = 'Новая',
    Request = 'Заявка',
    Open = 'Открыт',
    Closed = 'Отменен'
}
export enum ReservationStatusLabel {
    Queue = 'Живая очередь',
    New = 'Ожидает подтверждения',
    Request = 'Ожидаем',
    Open = 'В зале',
    Closed = 'Отменен'
}

export interface ITable {
    capacity: number,
    id: string,
    number: string,
    orders: IOrder[],
    reservations: IReservation[],
    zone: string
}
interface IRestaurant {
    closing_time: string,
    id: number,
    opening_time: string,
    restaurant_name: string,
    timezone: string
}
export interface IBookingsResponse {
  available_days: string[],
  current_day: string,
  restaurant: IRestaurant,
  tables: ITable[]
}