import toast from 'react-hot-toast';

const useToast = () => ({
  toastSuccess: (msg) => toast.success(msg),
  toastError:   (msg) => toast.error(msg),
  toastLoading: (msg) => toast.loading(msg),
  dismiss:      (id)  => toast.dismiss(id),
});

export default useToast;
