import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

type ChangeFeed<T> = { items: T[]; nextCursor: string | null };

@Injectable()
export class ErpClientService {
  constructor(private readonly http: HttpService) { }

  private get baseUrl() {
    // docker-compose can use http://company-erp:3000 ; local dev defaults to http://localhost:3001
    return process.env.COMPANY_ERP_BASE_URL ?? 'http://localhost:3001';
  }

  async getProductChanges(cursor?: string, limit = 100) {
    const url = `${this.baseUrl}/products/changes`;
    const res = await firstValueFrom(
      this.http.get<ChangeFeed<any>>(url, { params: { cursor, limit } }),
    );
    return res.data;
  }

  async getUserChanges(cursor?: string, limit = 100) {
    const url = `${this.baseUrl}/users/changes`;
    const res = await firstValueFrom(
      this.http.get<ChangeFeed<any>>(url, { params: { cursor, limit } }),
    );
    return res.data;
  }

  async getOrderChanges(cursor?: string, limit = 100) {
    const url = `${this.baseUrl}/orders/changes`;
    const res = await firstValueFrom(
      this.http.get<ChangeFeed<any>>(url, { params: { cursor, limit } }),
    );
    return res.data;
  }

  async getOrderById(id: string) {
    const url = `${this.baseUrl}/orders/${id}`;
    const res = await firstValueFrom(this.http.get<any>(url));
    return res.data;
  }
}
