import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageDropzoneComponent } from './image-dropzone.component';

describe('ImageDropzoneComponent', () => {
  let fixture: ComponentFixture<ImageDropzoneComponent>;
  let component: ImageDropzoneComponent;

  const setup = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [ImageDropzoneComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ImageDropzoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const imageFile = (name = 'logo.png', type = 'image/png') => new File(['image'], name, { type });

  beforeEach(() => TestBed.resetTestingModule());

  it('debe renderizar la etiqueta y la pista', async () => {
    await setup();
    fixture.componentRef.setInput('label', 'Logo');
    fixture.componentRef.setInput('hint', 'Solo PNG');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Logo');
    expect(text).toContain('Solo PNG');
  });

  it('debe emitir el archivo al seleccionarlo', async () => {
    await setup();
    const selected = vi.fn();
    component.fileSelected.subscribe(selected);
    const file = imageFile();

    component.onInputChange({
      target: { files: [file], value: 'logo.png' },
    } as unknown as Event);

    expect(selected).toHaveBeenCalledWith(file);
    expect(component.error()).toBeNull();
  });

  it('debe rechazar archivos que no son imágenes', async () => {
    await setup();
    const selected = vi.fn();
    component.fileSelected.subscribe(selected);

    component.onInputChange({
      target: { files: [new File(['x'], 'doc.pdf', { type: 'application/pdf' })], value: '' },
    } as unknown as Event);

    expect(selected).not.toHaveBeenCalled();
    expect(component.error()).toBe('El archivo debe ser una imagen.');
  });

  it('debe rechazar imágenes por encima del límite', async () => {
    await setup();
    fixture.componentRef.setInput('maxBytes', 2);
    fixture.detectChanges();
    const selected = vi.fn();
    component.fileSelected.subscribe(selected);

    component.onInputChange({
      target: { files: [imageFile()], value: '' },
    } as unknown as Event);

    expect(selected).not.toHaveBeenCalled();
    expect(component.error()).toContain('supera el límite');
  });

  it('debe emitir el archivo al soltarlo sobre la zona', async () => {
    await setup();
    const selected = vi.fn();
    component.fileSelected.subscribe(selected);
    const file = imageFile('drop.png');
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [file] },
    } as unknown as DragEvent;

    component.onDrop(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(selected).toHaveBeenCalledWith(file);
    expect(component.isDragging()).toBe(false);
  });

  it('debe emitir removed al quitar la imagen', async () => {
    await setup();
    const removed = vi.fn();
    component.removed.subscribe(removed);

    component.remove();

    expect(removed).toHaveBeenCalled();
  });

  it('no debe seleccionar archivos mientras sube o está deshabilitado', async () => {
    await setup();
    const selected = vi.fn();
    component.fileSelected.subscribe(selected);
    fixture.componentRef.setInput('uploading', true);
    fixture.detectChanges();

    component.onInputChange({
      target: { files: [imageFile()], value: '' },
    } as unknown as Event);

    expect(selected).not.toHaveBeenCalled();

    fixture.componentRef.setInput('uploading', false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.onDrop({
      preventDefault: vi.fn(),
      dataTransfer: { files: [imageFile()] },
    } as unknown as DragEvent);

    expect(selected).not.toHaveBeenCalled();
  });
});
