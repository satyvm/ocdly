// biome-ignore-all lint/performance/noJsxPropsBind: Handlers target native controls and use item-specific values.
import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

export function Modal({
	title,
	children,
	onClose,
	wide = false,
	className = "",
}: {
	title: string;
	children: ReactNode;
	onClose: () => void;
	wide?: boolean;
	className?: string;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const [closing, setClosing] = useState(false);
	useEffect(() => {
		const dialog = ref.current;
		const previousFocus = document.activeElement;
		const previousOverflow = document.body.style.overflow;
		dialog?.showModal();
		document.body.style.overflow = "hidden";
		return () => {
			dialog?.close();
			document.body.style.overflow = previousOverflow;
			if (previousFocus instanceof HTMLElement) {
				previousFocus.focus();
			}
		};
	}, []);
	function close() {
		if (closing) {
			return;
		}
		setClosing(true);
		window.setTimeout(onClose, 240);
	}
	return (
		<dialog
			aria-labelledby={titleId}
			className={`shop-modal ${wide ? "shop-modal-wide" : ""} ${className}`}
			data-closing={closing || undefined}
			onCancel={(event) => {
				event.preventDefault();
				close();
			}}
			ref={ref}
		>
			<div className="modal-heading">
				<h2 id={titleId}>{title}</h2>
				<button
					aria-label="Close dialog"
					className="icon-button"
					onClick={close}
					type="button"
				>
					<X size={22} />
				</button>
			</div>
			{children}
		</dialog>
	);
}
