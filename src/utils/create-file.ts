export const downloadExampleTxtFileUrl = () => {
  const txtContent = `Mail\tPassword\tRecover Mail\n
mail1@gmail.com\tabc123\tr_mail1@gmail.com\n
mail2@gmail.com\tabc1234\tr_mail2@gmail.com\n
mail3@gmail.com\tabc1235\tr_mail3@gmail.com`;

  // Tạo một đối tượng Blob để lưu trữ dữ liệu
  const blob = new Blob([txtContent], { type: 'text/plain' });

  // Tạo một đường link tạm thời để tải về file

  return window.URL.createObjectURL(blob);
};
