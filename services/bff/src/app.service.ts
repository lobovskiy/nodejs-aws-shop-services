import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class AppService {
  async getRecipientServiceResponse(
    recipientServiceName: string,
    request: Request
  ): Promise<AxiosResponse> {
    const recipientUrl = process.env[recipientServiceName];

    console.log('recipientUrl :>> ', recipientUrl);

    if (!recipientUrl) {
      throw new BadGatewayException('Cannot process request');
    }

    console.log('request :>> ', request);

    const { method, body, originalUrl } = request;

    try {
      const response = await axios({
        url: `${recipientUrl}${originalUrl}`,
        method,
        data: body,
      });

      console.log('response :>> ', response);

      return response;
    } catch (e) {
      console.log('e :>> ', e);

      if (e.response) {
        return e.response;
      }

      throw new InternalServerErrorException(e.message);
    }
  }
}
