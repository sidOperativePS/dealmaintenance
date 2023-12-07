import { Component, OnInit, ViewEncapsulation } from '@angular/core';
// for enterprise features
import { GridApi, Module, ColDef, ColGroupDef, GridReadyEvent, CellClickedEvent, CellDoubleClickedEvent, CellContextMenuEvent, ICellRendererParams, RowModelType, IDatasource, IGetRowsParams, CellValueChangedEvent } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { MenuModule } from '@ag-grid-enterprise/menu';
import { SideBarModule } from '@ag-grid-enterprise/side-bar';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { FiltersToolPanelModule } from '@ag-grid-enterprise/filter-tool-panel';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { StatusBarModule } from '@ag-grid-enterprise/status-bar';
import { HeaderGroupComponent } from '../header-group-component/header-group.component';
import { SortableHeaderComponent } from '../header-component/sortable-header.component';
import { RendererComponent } from '../renderer-component/renderer.component';
import { GridChartsModule } from '@ag-grid-enterprise/charts';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { HttpClient } from '@angular/common/http';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';

@Component({
    selector: 'rich-grid',
    templateUrl: 'rich-grid.component.html',
    styleUrls: ['rich-grid.css', 'proficiency-renderer.css'],
    encapsulation: ViewEncapsulation.None
})
export class RichGridComponent {
    public rowData!: any[];
    public columnDefs!: (ColDef | ColGroupDef)[];
    public rowCount!: string;
    public valueChange:any;
    public defaultColDef: ColDef;
    public components: any;
    public sideBar!: boolean;
    public rowBuffer = 0;
    public rowModelType: RowModelType = 'infinite';
    public cacheBlockSize = 50;
    public cacheOverflowSize = 2;
    public maxConcurrentDatasourceRequests = 1;
    public infiniteInitialRowCount = 100;
    public maxBlocksInCache = 10;
    public modules: Module[] = [
        InfiniteRowModelModule,
        ClientSideRowModelModule,
        MenuModule,
        SideBarModule,
        ColumnsToolPanelModule,
        FiltersToolPanelModule,
        StatusBarModule,
        GridChartsModule,
        RowGroupingModule,
        SetFilterModule,
        RangeSelectionModule
    ];

    public api!: GridApi;

    constructor(
        private http: HttpClient
    ) {
        this.defaultColDef = {
            filter: true,
            floatingFilter: true,
            headerComponent: 'sortableHeaderComponent',
            cellDataType: false,
            editable: true,
        };

        this.components = {
            sortableHeaderComponent: SortableHeaderComponent,
            headerGroupComponent: HeaderGroupComponent,
            rendererComponent: RendererComponent
        };
    }


    private calculateRowCount() {
        if (this.api && this.rowData) {
            const model = this.api.getModel();
            const totalRows = this.rowData.length;
            const processedRows = model.getRowCount();
            this.rowCount = processedRows.toLocaleString() + ' / ' + totalRows.toLocaleString();
        }
    }

    public onModelUpdated() {
        console.log('onModelUpdated');
        this.calculateRowCount();
    }

    public onGridReady(params: GridReadyEvent<any>) {
        this.columnDefs = [];
        this.http.get<any>('http://localhost:8080/employee-jpa/getAGEmployeeSpotData') .subscribe((data) => {
             // set the column headers from the data
             const colDefs:any = params.api.getColumnDefs();
             colDefs.length=0;
             const keys = Object.keys(data[0]);
             keys.forEach(key => {
                 if(key === 'Product'){
                     colDefs.push({field : key, pinned:'left', filter: 'agTextColumnFilter'});
                 } /*else if(key === '2023-12-31 23:30') {
                     colDefs.push({field : key, pinned:'right', filter: 'agTextColumnFilter'});
                 }*/ else {
                     colDefs.push({field : key, filter: 'agTextColumnFilter'});
                 }
             });
            
            const dataSource: IDatasource = {
              rowCount: undefined,
              getRows: (params: IGetRowsParams) => {
                setTimeout(() => {
                  // take a slice of the total rows
                  const rowsThisPage = data.slice(params.startRow, params.endRow);
                  // if on or after the last page, work out the last row.
                  let lastRow = -1;
                  if (data.length <= params.endRow) {
                    lastRow = data.length;
                  }
                  // call the success callback
                  params.successCallback(rowsThisPage, lastRow);
                  // add the data to the grid
                }, 500);
              },
            };
            params.api.setGridOption('datasource', dataSource);
            params.api.setGridOption('columnDefs', colDefs);
            

        })
        this.api = params.api;
        this.api.sizeColumnsToFit();
    }

    public onCellClicked($event: CellClickedEvent) {
        console.log('onCellClicked: ' + $event.rowIndex + ' ' + $event.colDef.field);
    }

    public onCellValueChanged($event: CellValueChangedEvent) {
        console.log('onCellDoubleClicked: ' + $event.rowIndex + ' ' + $event.colDef.field);
        this.valueChange = 'New value Updated at Row Index : ' + $event.rowIndex + ' ' + 'Column Name : ' + $event.colDef.field + ' '  + 'New Value : ' + $event.value;
    }

    public onCellContextMenu($event: CellContextMenuEvent) {
        console.log('onCellContextMenu: ' + $event.rowIndex + ' ' + $event.colDef.field);
    }

    public onQuickFilterChanged($event: any) {
        this.api.setQuickFilter($event.target.value);
        // this.api.redrawRows();
        //  this.api.setGridOption('quickFilterText', $event.target.value)
    }

    public invokeSkillsFilterMethod() {
        this.api.getFilterInstance('skills', (instance) => {
            (instance as any).helloFromSkillsFilter();
        });
    }

    public toggleSidebar($event: any) {
        this.sideBar = $event.target.checked;
    }
}


