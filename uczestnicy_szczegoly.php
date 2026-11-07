<?php
  include("conn.php");
  if(isset($_GET['id']))
  {
    $id = mysqli_real_escape_string($conn, $_GET['id']);
  }
?>

<!doctype html>
<html lang="en">
  <head>
    <title>Uczestnicy - szczegóły</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="style1.css">
  </head>
  <body>
      <?php
         include("nav.php");
         $query = "SELECT nick FROM uczestnicy WHERE id=$id";
         $result = mysqli_query($conn,$query);
         $row = mysqli_fetch_row($result);
         $query2 = "SELECT count(*) FROM uczestnicy";
         $result2 = mysqli_query($conn,$query2);
         $row2 = mysqli_fetch_row($result2);
      ?>

      <section>
         <p class="tytul">
            <?php echo $row[0]?>
         </p>
         <div id="tabela">
            <table>
               <th colspan=2>Edycja</th>
               <th colspan=2>Utwór</th>
               <th>Państwo</th>
               <?php
                  $query = "SELECT piosenkaudzial.idedycji, edycje.nazwa, piosenki.utwor, uczestnicy.nick, piosenkaudzial.wygrana, piosenkaudzial.iduczestnika, panstwa.nazwa AS 'kraj', piosenkaudzial.idpanstwa FROM piosenkaudzial INNER JOIN piosenki ON piosenki.id=piosenkaudzial.idpiosenki INNER JOIN uczestnicy ON uczestnicy.id=piosenkaudzial.iduczestnika INNER JOIN edycje ON edycje.id=piosenkaudzial.idedycji INNER JOIN panstwa ON panstwa.id=piosenkaudzial.idpanstwa WHERE piosenkaudzial.iduczestnika=$id ORDER BY piosenkaudzial.idedycji DESC";
                  $result = mysqli_query($conn,$query);
                  foreach($result as $row)
                  {
               ?>
                  <tr>
                     <td style='text-align:center; font-weight:bold; width:40px;'><a href="edycje_szczegoly.php?id=<?php echo $row['idedycji'];?>"><?php echo $row['idedycji'];?></a></td>
                     <td class="px300"><a href="edycje_szczegoly.php?id=<?php echo $row['idedycji'];?>"><?php echo $row['nazwa']?></a></td>
                     <td class="yt"><a href="https://www.youtube.com/results?search_query=<?php echo str_replace('&', '', $row['utwor']); ?>" target="_blank"><img src="img/yt.png"></a></td>
                     <?php
                        if($row['wygrana']==1) {
                     ?>
                     <td><b><?php echo $row['utwor']; ?></b></td>
                     <td class="px200">
                        <?php echo '<img width=20px src="img/flags/' . $row['kraj'] . '.png" alt="">'; ?>
                        <b><a href="panstwa_szczegoly.php?id=<?php echo $row['idpanstwa'];?>"><?php echo $row['kraj']; ?></a></b>
                     </td>
                     <?php
                        } else {
                     ?>
                     <td><?php echo $row['utwor']; ?></td>
                     <td class="px200">
                        <?php echo '<img width=20px src="img/flags/' . $row['kraj'] . '.png" alt="">'; ?>
                        <a href="panstwa_szczegoly.php?id=<?php echo $row['idpanstwa'];?>"><?php echo $row['kraj']; ?></a>
                     </td>
                     <?php
                        }
                     ?>
                  </tr>
               <?php
                  }
               ?>
            </table>
         </div>
      </section>
      
      <?php
         include("footer.php");
      ?>
      <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
      <script src="js/bootstrap.min.js"></script>
  </body>
</html>