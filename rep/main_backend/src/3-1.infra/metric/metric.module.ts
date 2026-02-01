import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrometheusService } from "./prometheus/prometheus.service";
import { HttpMetricsInterceptor, WsMetricsInterceptor } from "./prometheus/prometheus.intercepter";


@Global()
@Module({
  providers : [
    ConfigService,
    PrometheusService,
    HttpMetricsInterceptor,
    WsMetricsInterceptor
  ],
  exports : [
    PrometheusService,
    HttpMetricsInterceptor,
    WsMetricsInterceptor
  ]
})
export class PrometheusModule {};