import {ComponentFixture, fakeAsync, TestBed} from "@angular/core/testing";
import {FormsModule} from "@angular/forms";
import {MatFormFieldModule, MatSlideToggle, MatSlideToggleModule} from "@angular/material";
import {By} from "@angular/platform-browser";
import {INPUT_SCHEMA} from "../../input";
import {BooleanComponent} from "./boolean.component";

describe("Common#boolean", () => {
  beforeEach(() => {
    TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [FormsModule, MatFormFieldModule, MatSlideToggleModule],
        declarations: [BooleanComponent],
        providers: [
          {
            provide: INPUT_SCHEMA,
            useValue: {
              type: "boolean"
            }
          }
        ]
      })
      .compileComponents();
  });

  describe("basic behavior", () => {
    let fixture: ComponentFixture<BooleanComponent>;
    let labelElement: HTMLLabelElement;
    let slideToggle: MatSlideToggle;

    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(BooleanComponent);
      fixture.detectChanges();
      labelElement = fixture.debugElement.query(By.css("label")).nativeElement;
      slideToggle = fixture.debugElement.query(By.css("mat-slide-toggle")).componentInstance;
    }));

    it("should default to default value if undefined", () => {
      const fixture = TestBed.createComponent(BooleanComponent);
      const changeSpy = jasmine.createSpy("ngModelChange");
      fixture.componentInstance.registerOnChange(changeSpy);

      fixture.componentInstance.schema.default = true;
      fixture.componentInstance.writeValue(undefined);
      fixture.detectChanges();
      expect(changeSpy).toHaveBeenCalledWith(true);

      fixture.componentInstance.schema.default = false;
      fixture.componentInstance.writeValue(undefined);
      fixture.detectChanges();
      expect(changeSpy).toHaveBeenCalledWith(false);
    });

    it("should propagate true on click if the start value is false", () => {
      const changeSpy = jasmine.createSpy("ngModelChange");
      fixture.componentInstance.registerOnChange(changeSpy);
      fixture.componentInstance.writeValue(false);

      labelElement.click();
      fixture.detectChanges();
      expect(changeSpy).toHaveBeenCalledWith(true);
      expect(slideToggle.checked).toBe(true);
    });

    it("should propagate false on click if the start value is true", () => {
      const changeSpy = jasmine.createSpy("ngModelChange");
      fixture.componentInstance.registerOnChange(changeSpy);
      fixture.componentInstance.writeValue(true);

      labelElement.click();
      fixture.detectChanges();
      expect(changeSpy).toHaveBeenCalledWith(true);
      expect(slideToggle.checked).toBe(true);
    });
  });
});
