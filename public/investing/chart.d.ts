// Definitions for chart.js

declare module "chart.js" {
  export type ChartType =
    | "line"
    | "bar"
    | "pie"
    | "doughnut"
    | "radar"
    | "polarArea"
    | "bubble"
    | "scatter";

  export interface ChartDataset<TType extends ChartType = ChartType, TData = number[]> {
    label?: string;
    data: TData;
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean | string;
    parsing?: boolean;
    tension?: number;
  }

  export interface ChartOptions<TType extends ChartType = ChartType> {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: any;
    scales?: any;
    animation?: any;
    onClick?: (event: unknown, elements: unknown[]) => void;
  }

  export interface ChartConfiguration<
    TType extends ChartType = ChartType,
    TData = number[],
    TDataset = ChartDataset<TType, TData>
  > {
    type: TType;
    data: {
      labels?: string[];
      datasets: TDataset[];
    };
    options?: ChartOptions<TType>;
    plugins?: any[];
  }

  export class Chart<
    TType extends ChartType = ChartType,
    TData = number[],
    TDataset = ChartDataset<TType, TData>
  > {
    constructor(
      context: CanvasRenderingContext2D | HTMLCanvasElement,
      config: ChartConfiguration<TType, TData, TDataset>
    );

    readonly data: ChartData<TType, TData>;
    
    setDatasetVisibility(index: number, visible: boolean): void;
    update(): void;
    destroy(): void;
    resize(): void;
  }
}
