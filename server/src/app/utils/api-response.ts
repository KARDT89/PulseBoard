interface HttpResponse {
  status(code: number): this;
  json(data: any): void;
  send(): void;
}

class ApiResponse {
  static ok(res: HttpResponse, message: string, data: any = null) {
    return res.status(200).json({ success: true, message, data });
  }
  static created(res: HttpResponse, message: string, data: any = null) {
    return res.status(201).json({ success: true, message, data });
  }
  static noContent(res: HttpResponse) {
    return res.status(204).send();
  }
}

export default ApiResponse;
