import fetch, {RequestInit} from 'node-fetch'
import * as FormData from 'form-data'
import * as FileList from 'node-filelist'

export interface AppCMSClientConfig {
    apiKey: string
    baseUrl?: string

}

export class AppCMSClient<Content> {

    private baseURL: string = "https://www.appcms.dk"
    private accessToken: string = ''

    constructor(
        private clientConfig: AppCMSClientConfig
    ) {

        if(clientConfig.baseUrl) {
            this.baseURL = clientConfig.baseUrl
        }

    }

    public setAccessToken = (token: string) => {
        this.accessToken = token
    }

    private generateURL = (endpoint: string, withAPIKey: boolean = true) => {
        let url = `${this.baseURL}`

        if(withAPIKey) {
            url += `/api/${this.clientConfig.apiKey}`
        }

        if(endpoint.charAt(0) !== "/") {
            return `${url}/${endpoint}`
        }

        return `${url}${endpoint}`
    }

    private makeRequest = async (url: string, method="get", data?: any): Promise<Content> => {
        const requestOptions: RequestInit = {
            method,
            headers: {},
        }

        if(this.accessToken.length > 0) {
            requestOptions.headers["authorization"] = `Bearer ${this.accessToken}`
        }



        switch (method.toLowerCase()) {
            case "post":
            case "patch":
            case 'put':
                requestOptions.method = method

                if(data instanceof FormData) {
                    requestOptions.body = data
                }
                else {
                    requestOptions.body = JSON.stringify(data)
                    requestOptions.headers['content-type'] = 'application/json'
                }


                break
        }

        console.log(`[Request] init - ${url} - ${method} - ${JSON.stringify(data)} - ${JSON.stringify(requestOptions.headers)}`)


        const response = await fetch(url, requestOptions)
        const contentType: string|undefined = response.headers["content-type"]

        if(contentType && contentType.toLowerCase() !== "application/json") {
            const text = await response.text()

        }

        const json = await response.json()


        return json
    }


    get analytics() {
        return {
            log: (event: string, platform: string, deviceId: string, data?: string) => {
                return this.makeRequest(this.generateURL("/analytics/log"), "post", {
                    analytic: {
                        event,
                        platform,
                        device_id: deviceId,
                        data
                    }
                })
            }
        }
    }


    get appConfig() {
        return {
            fetch: () => {
                return this.makeRequest(this.generateURL(`/app_config`))
            }
        }
    }

    get content() {
        return {
            fetch: (locale: string): Promise<Content> => {
                return this.makeRequest(this.generateURL(`/content/${locale}`))
            },
            file: (fileId: string) => {
                return this.makeRequest(this.generateURL(`/content/file/${fileId}`))
            }
        }
    }


    get vinduesgrossisten() {
        const self = this
        function tasks(date: string) {
            return this.makeRequest(this.generateURL(`/vinduesgrossisten/tasks?date=${date}`))
        }

        return {
            login: (accessKey: string) => {
                return this.makeRequest(this.generateURL(`/vinduesgrossisten/engineer-login`), "post", {access_key: accessKey})
            },
            tasks: (date: string) => {
                return this.makeRequest(this.generateURL(`/vinduesgrossisten/tasks?date=${date}`))
            },
            taskUpdate: (taskId: string, values: {note?: string, materials?: string}) => {
                return this.makeRequest(this.generateURL(`/vinduesgrossisten/tasks/${taskId}`), "patch", values)
            },
            tasksUpdateStatus: (taskId: string|number, statusId: string, note: string)  => {
                return this.makeRequest(this.generateURL(`/vinduesgrossisten/tasks/${taskId}/status`), "put", {vin_status_id: statusId, note})
            },
            statuses: () => {
                return this.makeRequest(this.generateURL(`/vinduesgrossisten/statuses`))
            },

            notes: (taskId: string|number) => {
                const baseUrl = this.generateURL(`/vinduesgrossisten/tasks/${taskId}/notes`)
                const generateURL = (endpoint: string) => {
                    return `${baseUrl}${endpoint}`
                }


                return {
                    get() {

                    }
                }
            },


            taskCreateDocumentations(taskId: number|string, data: FormData) {
                return self.makeRequest(self.generateURL(`/vinduesgrossisten/tasks/${taskId}/documentations`), 'post', data)
            },

            taskUpdateDocumentations(taskId: number|string, values: {note?: string}) {
                return self.makeRequest(self.generateURL(`/vinduesgrossisten/tasks/${taskId}/documentations`), 'patch', values)
            },

            taskDeleteDocumentation(taskId: number|string, documentationId: string|number) {
                return self.makeRequest(self.generateURL(`/vinduesgrossisten/tasks/${taskId}/documentations/${documentationId}`), "delete")
            },

            taskDeleteDocumentationImage(taskId: number|string, documentationId: string|number, imageId: string|number) {
                return self.makeRequest(self.generateURL(`/vinduesgrossisten/tasks/${taskId}/documentations/${documentationId}/images/${imageId}`), "delete")
            },
        }
    }

}

