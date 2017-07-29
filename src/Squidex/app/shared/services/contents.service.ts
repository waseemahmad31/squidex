/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Sebastian Stehle. All rights reserved
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import 'framework/angular/http-extensions';

import {
    ApiUrlConfig,
    DateTime,
    HTTP,
    Version
} from 'framework';

export class ContentsDto {
    constructor(
        public readonly total: number,
        public readonly items: ContentDto[]
    ) {
    }
}

export class ContentDto {
    constructor(
        public readonly id: string,
        public readonly isPublished: boolean,
        public readonly createdBy: string,
        public readonly lastModifiedBy: string,
        public readonly created: DateTime,
        public readonly lastModified: DateTime,
        public readonly data: any,
        public readonly version: Version
    ) {
    }

    public publish(user: string): ContentDto {
        return new ContentDto(
            this.id,
            true,
            this.createdBy, user,
            this.created, DateTime.now(),
            this.data,
            this.version);
    }

    public unpublish(user: string): ContentDto {
        return new ContentDto(
            this.id,
            false,
            this.createdBy, user,
            this.created, DateTime.now(),
            this.data,
            this.version);
    }

    public update(data: any, user: string): ContentDto {
        return new ContentDto(
            this.id,
            this.isPublished,
            this.createdBy, user,
            this.created, DateTime.now(),
            data,
            this.version);
    }
}

@Injectable()
export class ContentsService {
    constructor(
        private readonly http: HttpClient,
        private readonly apiUrl: ApiUrlConfig
    ) {
    }

    public getContents(appName: string, schemaName: string, take: number, skip: number, query?: string, ids?: string[]): Observable<ContentsDto> {
        const queryParts: string[] = [];

        if (query && query.length > 0) {
            if (query.indexOf('$filter') < 0 &&
                query.indexOf('$search') < 0 &&
                query.indexOf('$orderby') < 0) {
                queryParts.push(`$search="${query.trim()}"`);
            } else {
                queryParts.push(`${query.trim()}`);
            }
        }

        if (take > 0) {
            queryParts.push(`$top=${take}`);
        }

        if (skip > 0) {
            queryParts.push(`$skip=${skip}`);
        }

        if (ids && ids.length > 0) {
            queryParts.push(`ids=${ids.join(',')}`);
        }

        const fullQuery = queryParts.join('&');

        const url = this.apiUrl.buildUrl(`/api/content/${appName}/${schemaName}?${fullQuery}`);

        return HTTP.getVersioned(this.http, url)
                .map(response => {
                    const items: any[] = response.items;

                    return new ContentsDto(response.total, items.map(item => {
                        return new ContentDto(
                            item.id,
                            item.isPublished,
                            item.createdBy,
                            item.lastModifiedBy,
                            DateTime.parseISO_UTC(item.created),
                            DateTime.parseISO_UTC(item.lastModified),
                            item.data,
                            new Version(item.version.toString()));
                    }));
                })
                .pretifyError('Failed to load contents. Please reload.');
    }

    public getContent(appName: string, schemaName: string, id: string, version?: Version): Observable<ContentDto> {
        const url = this.apiUrl.buildUrl(`/api/content/${appName}/${schemaName}/${id}`);

        return HTTP.getVersioned(this.http, url, version)
                .map(response => {
                    return new ContentDto(
                        response.id,
                        response.isPublished,
                        response.createdBy,
                        response.lastModifiedBy,
                        DateTime.parseISO_UTC(response.created),
                        DateTime.parseISO_UTC(response.lastModified),
                        response.data,
                        new Version(response.version.toString()));
                })
                .pretifyError('Failed to load content. Please reload.');
    }

    public postContent(appName: string, schemaName: string, dto: any, publish: boolean, version?: Version): Observable<ContentDto> {
        const url = this.apiUrl.buildUrl(`/api/content/${appName}/${schemaName}?publish=${publish}`);

        return HTTP.postVersioned(this.http, url, dto, version)
                .map(response => {
                    return new ContentDto(
                        response.id,
                        response.isPublished,
                        response.createdBy,
                        response.lastModifiedBy,
                        DateTime.parseISO_UTC(response.created),
                        DateTime.parseISO_UTC(response.lastModified),
                        response.data,
                        new Version(response.version.toString()));
                })
                .pretifyError('Failed to create content. Please reload.');
    }

    public putContent(appName: string, schemaName: string, id: string, dto: any, version?: Version): Observable<any> {
        const url = this.apiUrl.buildUrl(`/api/content/${appName}/${schemaName}/${id}`);

        return HTTP.putVersioned(this.http, url, dto, version)
                .pretifyError('Failed to update content. Please reload.');
    }

    public publishContent(appName: string, schemaName: string, id: string, version?: Version): Observable<any> {
        const url = this.apiUrl.buildUrl(`/api/content/${appName}/${schemaName}/${id}/publish`);

        return HTTP.putVersioned(this.http, url, {}, version)
                .pretifyError('Failed to publish content. Please reload.');
    }

    public unpublishContent(appName: string, schemaName: string, id: string, version?: Version): Observable<any> {
        const url = this.apiUrl.buildUrl(`/api/content/${appName}/${schemaName}/${id}/unpublish`);

        return HTTP.putVersioned(this.http, url, {}, version)
                .pretifyError('Failed to unpublish content. Please reload.');
    }

    public deleteContent(appName: string, schemaName: string, id: string, version?: Version): Observable<any> {
        const url = this.apiUrl.buildUrl(`/api/content/${appName}/${schemaName}/${id}`);

        return HTTP.deleteVersioned(this.http, url, version)
                .pretifyError('Failed to delete content. Please reload.');
    }
}