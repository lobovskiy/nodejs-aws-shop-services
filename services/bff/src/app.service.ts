import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class AppService {
  async getRecipientServiceResponse(
    recipientServiceName: string,
    request: Request
  ): Promise<AxiosResponse> {
    const recipientUrl = process.env[recipientServiceName];

    if (!recipientUrl) {
      throw new BadGatewayException('Cannot process request');
    }

    const { headers, method, body, originalUrl } = request;

    try {
      const originalPath =
        recipientServiceName === 'cart'
          ? originalUrl.slice('/cart'.length)
          : originalUrl;
      const url = `${recipientUrl}${originalPath}`;
      console.log('url :>> ', url);
      const serviceRequestConfig: AxiosRequestConfig = {
        url,
        method,
        headers: {},
      };

      if (headers['authorization']) {
        serviceRequestConfig.headers['Authorization'] =
          headers['authorization'];
      }

      if (Object.keys(body).length) {
        serviceRequestConfig.data = body;
      }

      return await axios.request(serviceRequestConfig);
    } catch (e) {
      if (e.response) {
        return e.response;
      }

      throw new InternalServerErrorException(e.message);
    }
  }
}
